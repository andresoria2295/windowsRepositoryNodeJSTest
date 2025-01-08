import { Injectable, Inject, BadRequestException } from '@nestjs/common';
import { Pool } from 'pg';
import * as fs from 'fs';
import * as path from 'path';
import * as FormData from 'form-data';
import { Readable } from 'node:stream';
import axios from 'axios';


@Injectable()
export class UserService {
  constructor(@Inject('DATABASE_CONNECTION') private readonly pool: Pool) {}

  //Función para normalizar los nombres de los campos
  private normalizeFields(tableFields: Record<string, string>, inputData: any): any {
    console.log('Input data before normalize:', inputData);
    const normalized = Object.keys(inputData).reduce((acc, key) => {
        // Convertimos la key a minúsculas para la comparación
        const lowerKey = key.toLowerCase();
        
        // Obtenemos el nombre del campo normalizado
        let normalizedKey = lowerKey === 'contraseña' 
            ? 'Contraseña' 
            : tableFields[lowerKey];

        // Si no encontramos el campo en el mapeo, lo ignoramos
        if (!normalizedKey) {
            console.log(`Campo ignorado: ${key} - no encontrado en el mapeo`);
            return acc;
        }

        // Procesamiento especial para fechas
        if (normalizedKey.toLowerCase().includes('fecha')) {
            acc[normalizedKey] = inputData[key] === '' || inputData[key] === null 
                ? null 
                : inputData[key];
        } else {
            acc[normalizedKey] = inputData[key];
        }

        console.log(`Campo normalizado: ${key} -> ${normalizedKey} = ${acc[normalizedKey]}`);
        return acc;
    }, {} as any);

    console.log('Normalized data:', normalized);
    return normalized;
}

  //Lógica para envio de archivo a la API B y adquirir el UUID
  async sendFile(file: Express.Multer.File): Promise<string> {
    try {
      const formData = new FormData();
      const stream = Readable.from(file.buffer);
  
      //Adjunta el archivo al formulario
      formData.append('file', stream, file.originalname);
  
      //Usa los encabezados dinámicos generados por FormData
      const headers = formData.getHeaders();
  
      //Realiza la solicitud a la API B
      const response = await axios.post('http://localhost:4000/file/upload', formData, {
        headers,
      });
  
      //Log para depuración detallada
      console.log('Respuesta completa de la API B:', response.data); // Verifica todos los datos que recibimos
  
      //Valida si la respuesta tiene el UUID esperado
      if (response.status === 200 || response.status === 201) {  // Aceptamos tanto 200 como 201
        //Revisa el uuid directamente desde response.data.uuid
        if (response.data.uuid) {
          console.log('UUID encontrado directamente en response.data.uuid:', response.data.uuid);
          return response.data.uuid; // Retorna el UUID recibido directamente desde la respuesta
        } 
        //Revisa el uuid dentro de response.data.file.uuid
        else if (response.data.file && response.data.file.uuid) {
          console.log('UUID encontrado dentro de response.data.file.uuid:', response.data.file.uuid);
          return response.data.file.uuid; // Si el uuid está dentro del campo 'file'
        } else {
          console.error('No se pudo obtener el UUID del archivo desde la API B (sin UUID en la respuesta)');
          throw new Error('No se pudo obtener el UUID del archivo desde la API B.');
        }
      } else {
        console.error('Error en la respuesta de la API B, código:', response.status);
        throw new Error('Error en la respuesta de la API B, código: ' + response.status);
      }
    } catch (error) {
      console.error('Error al enviar el archivo a la API B:', error.message);
      throw new Error('Error al enviar el archivo a la API B: ' + error.message);
    }
  }
  
  //Método para creación de usuarios
  async createUser(newUserData: any, file?: Express.Multer.File): Promise<void> {
    const {
      nombre,
      apellido,
      fecha_nacimiento,
      email,
      contraseña,
      telefono,
      domicilio,
      ciudad,
      pais,
      formacion,
      empresa,
      empleo,
    } = newUserData;
  
    console.log('Datos recibidos para crear usuario:', { nombre, apellido, fecha_nacimiento, email, contraseña });
    if (!nombre || !apellido || !fecha_nacimiento || !email || !contraseña) {
      throw new Error('Faltan datos obligatorios: nombre, apellido, fecha de nacimiento, email y/o contraseña.');
    }
  
    const client = await this.pool.connect();
    try {
      await client.query('BEGIN');
  
      //Paso 1: Inserta el Usuario
      const userResult = await client.query(
        `INSERT INTO "Usuario" ("Nombre", "Apellido", "Fecha_Nacimiento", "Email", "Contraseña", "Fecha_Creacion") 
         VALUES ($1, $2, $3, $4, $5, NOW()) RETURNING "Id_Usuario"`,
        [nombre, apellido, fecha_nacimiento, email, contraseña],
      );
      const usuarioId = userResult.rows[0].Id_Usuario;
  
      //Paso 2: Maneja el Contacto (opcional)
      if (telefono || domicilio || ciudad || pais) {
        await client.query(
          `INSERT INTO "Contacto" ("Id_Usuario", "Telefono", "Domicilio", "Ciudad", "Pais") 
           VALUES ($1, $2, $3, $4, $5)`,
          [usuarioId, telefono || null, domicilio || null, ciudad || null, pais || null],
        );
      }
  
      //Paso 3: Inserta la Formación (opcional)
      let formacionId = null;
      if (formacion) {
        const { nombre, descripcion, nivel, institucion, duracion, fecha_titulo, activo, identificador_archivo } =
          formacion;
        const formacionResult = await client.query(
          `INSERT INTO "Formacion" ("Nombre", "Descripcion", "Nivel", "Institucion", "Duracion", "Fecha_Titulo", "Activo", "Identificador_Archivo") 
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING "Id_Formacion"`,
          [nombre, descripcion || null, nivel || null, institucion || null, duracion || null, fecha_titulo || null, activo || true, identificador_archivo || null],
        );
        formacionId = formacionResult.rows[0].Id_Formacion;
      }
  
      //Paso 4: Inserta la Empresa (opcional)
      let empresaId = null;
      if (empresa) {
        const { nombre, razon_social, direccion, ciudad, pais, telefono, email, sitio_web, industria, estado } = empresa;
        const empresaResult = await client.query(
          `INSERT INTO "Empresa" ("Nombre", "Razon_Social", "Direccion", "Ciudad", "Pais", "Telefono", "Email", "Sitio_Web", "Industria", "Estado") 
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10) RETURNING "Id_Empresa"`,
          [nombre, razon_social || null, direccion || null, ciudad || null, pais || null, telefono || null, email || null, sitio_web || null, industria || null, estado || true],
        );
        empresaId = empresaResult.rows[0].Id_Empresa;
      }
  
      //Paso 5: Inserta el Empleo (opcional)
      if (empleo) {
        const { fecha_inicio, posicion, activo } = empleo;
        if (empresaId) {
          await client.query(
            `INSERT INTO "Empleo" ("Id_Usuario", "Id_Formacion", "Id_Empresa", "Fecha_Inicio", "Posicion", "Activo") 
             VALUES ($1, $2, $3, $4, $5, $6)`,
            [usuarioId, formacionId, empresaId, fecha_inicio || null, posicion || null, activo || true],
          );
        }
      }
  
      await client.query('COMMIT');
    } catch (error) {
      await client.query('ROLLBACK');
      console.error('Error al crear el usuario:', error);
      throw new Error('Error al crear el usuario: ' + error.message);
    } finally {
      client.release();
    }
  }  
  

//Método para lectura de datos completos.
async getAllUsers(): Promise<any[]> {
    const client = await this.pool.connect();
    try {
        //await client.query('BEGIN');

        //Consulta todos los usuarios
        const usuariosResult = await client.query(`SELECT * FROM "Usuario" ORDER BY "Fecha_Creacion" DESC`);

        const usuariosCompleto = await Promise.all(
            usuariosResult.rows.map(async (usuario: any) => {
                //Consulta los datos de contacto
                const contactoResult = await client.query(
                    `SELECT * FROM "Contacto" WHERE "Id_Usuario" = $1`,
                    [usuario.Id_Usuario]
                );
                const contacto = contactoResult.rows[0] || null;

                //Consulta el empleo (con formación y empresa relacionadas)
                const empleoResult = await client.query(
                    `SELECT * FROM "Empleo" WHERE "Id_Usuario" = $1`,
                    [usuario.Id_Usuario]
                );
                const empleo = empleoResult.rows[0] || null;

                let formacion = null;
                let empresa = null;

                if (empleo) {
                    const formacionResult = await client.query(
                        `SELECT * FROM "Formacion" WHERE "Id_Formacion" = $1`,
                        [empleo.Id_Formacion]
                    );
                    formacion = formacionResult.rows[0] || null;

                    const empresaResult = await client.query(
                        `SELECT * FROM "Empresa" WHERE "Id_Empresa" = $1`,
                        [empleo.Id_Empresa]
                    );
                    empresa = empresaResult.rows[0] || null;
                }

                //Oculta campos no deseados
                delete usuario.Id_Usuario;
                if (contacto) {
                    delete contacto.Id_Contacto;
                    delete contacto.Id_Usuario;
                }
                if (formacion) {
                    delete formacion.Id_Formacion;
                }
                if (empresa) {
                    delete empresa.Id_Empresa;
                }
                if (empleo) {
                    delete empleo.Id_Empleo;
                    delete empleo.Id_Usuario;
                    delete empleo.Id_Empresa;
                    delete empleo.Id_Formacion;
                }

                //Combina todos los datos en un objeto final
                return {
                    usuario,
                    contacto,
                    formacion,
                    empresa,
                    empleo,
                };
            })
        );

        //await client.query('COMMIT');
        return usuariosCompleto;
    } catch (error) {
        await client.query('ROLLBACK');
        console.error('Error al obtener todos los usuarios:', error);
        throw new Error('Error al obtener todos los usuarios: ' + error.message);
    } finally {
        client.release();
    }
}

//Método para leer los datos de un usuario específico
async getSpecificUser(userId: number): Promise<any> {
    const client = await this.pool.connect();
    try {
        //Inicia la transacción
        await client.query('BEGIN');

        //Consulta los datos básicos del usuario
        const usuarioResult = await client.query(
            `SELECT * FROM "Usuario" WHERE "Id_Usuario" = $1`,
            [userId]
        );
        if (usuarioResult.rows.length === 0) {
            throw new Error('Usuario no encontrado');
        }
        const usuario = usuarioResult.rows[0];

        //Consulta los datos de contacto
        const contactoResult = await client.query(
            `SELECT * FROM "Contacto" WHERE "Id_Usuario" = $1`,
            [userId]
        );
        const contacto = contactoResult.rows[0] || null;

        //Consulta la formación del usuario
        const formacionResult = await client.query(
            `SELECT * FROM "Formacion" WHERE "Id_Formacion" = (SELECT "Id_Formacion" FROM "Empleo" WHERE "Id_Usuario" = $1)`,
            [userId]
        );
        const formacion = formacionResult.rows[0] || null;

        //Consulta la empresa del usuario
        const empresaResult = await client.query(
            `SELECT * FROM "Empresa" WHERE "Id_Empresa" = (SELECT "Id_Empresa" FROM "Empleo" WHERE "Id_Usuario" = $1)`,
            [userId]
        );
        const empresa = empresaResult.rows[0] || null;

        //Consulta el empleo del usuario
        const empleoResult = await client.query(
            `SELECT * FROM "Empleo" WHERE "Id_Usuario" = $1`,
            [userId]
        );
        const empleo = empleoResult.rows[0] || null;

        //Combina y filtra todos los datos para ocultar campos innecesarios
        const usuarioCompleto = {
            usuario: {
                ...usuario,
                Id_Usuario: undefined,  //Oculta este campo
            },
            contacto: contacto
                ? {
                    ...contacto,
                    Id_Contacto: undefined,
                    Id_Usuario: undefined,
                }
                : null,
            formacion: formacion
                ? {
                    ...formacion,
                    Id_Formacion: undefined,
                }
                : null,
            empresa: empresa
                ? {
                    ...empresa,
                    Id_Empresa: undefined,
                }
                : null,
            empleo: empleo
                ? {
                    ...empleo,
                    Id_Empleo: undefined,
                    Id_Usuario: undefined,
                    Id_Empresa: undefined,
                    Id_Formacion: undefined,
                }
                : null,
        };

        //Confirma la transacción
        await client.query('COMMIT');
        return usuarioCompleto;
    } catch (error) {
        await client.query('ROLLBACK');
        console.error('Error al obtener los datos del usuario:', error);
        throw new Error('Error al obtener los datos del usuario: ' + error.message);
    } finally {
        client.release();
    }
}

async updateUserFields(userId: number, data: any): Promise<void> {
    const client = await this.pool.connect();
    try {
        await client.query('BEGIN');
        console.log('Datos recibidos:', data);

        //Mapeo de campos de la base de datos
        const fieldMappings = {
          usuario: {
              nombre: 'Nombre',
              apellido: 'Apellido',
              fecha_nacimiento: 'Fecha_Nacimiento',
              email: 'Email',
              contraseña: 'Contraseña',
          },
          contacto: {
              telefono: 'Telefono',
              domicilio: 'Domicilio',
              ciudad: 'Ciudad',
              pais: 'Pais',
          },
          formacion: {
              nombre: 'Nombre',
              descripcion: 'Descripcion',
              nivel: 'Nivel',
              institucion: 'Institucion',
              duracion: 'Duracion',
              fecha_titulo: 'Fecha_Titulo',
              activo: 'Activo',
              identificador_archivo: 'Identificador_Archivo',
          },
          empresa: {
              nombre: 'Nombre',
              razon_social: 'Razon_Social',
              direccion: 'Direccion',
              ciudad: 'Ciudad',
              pais: 'Pais',
              telefono: 'Telefono',
              email: 'Email',
              sitio_web: 'Sitio_Web',
              industria: 'Industria',
              estado: 'Estado',
          },
          empleo: {
              fecha_inicio: 'Fecha_Inicio',
              fecha_fin: 'Fecha_Fin',
              posicion: 'Posicion',
              activo: 'Activo',
          },
      };

        //Separa los datos planos de usuario y contacto
        const usuarioFields = ['nombre', 'apellido', 'email', 'fecha_nacimiento', 'contraseña'];
        const contactoFields = ['telefono', 'domicilio', 'ciudad', 'pais'];
        
        //Crea objetos para usuario y contacto desde datos planos
        const usuarioData = {};
        const contactoData = {};
        
        //Procesa campos planos
        Object.keys(data).forEach(key => {
            const lowerKey = key.toLowerCase();
            if (usuarioFields.includes(lowerKey)) {
                usuarioData[lowerKey] = data[key];
            } else if (contactoFields.includes(lowerKey)) {
                contactoData[lowerKey] = data[key];
            }
        });

        //Reconstruye el objeto data con la estructura correcta
        const processedData = {
            ...data,
            usuario: Object.keys(usuarioData).length > 0 ? usuarioData : undefined,
            contacto: Object.keys(contactoData).length > 0 ? contactoData : undefined
        };

        console.log('Datos procesados:', processedData);

        //Función auxiliar para generar consultas de actualización
        const generateUpdateQuery = (tableName: string, data: any, whereColumn: string): {
          query: string;
          values: any[];
      } => {
          const setClause = Object.keys(data)
              .map((key, index) => `"${key}" = $${index + 1}`)
              .join(', ');
          const values = [...Object.values(data), userId];
          const query = `
              UPDATE "${tableName}" 
              SET ${setClause}
              WHERE "${whereColumn}" = $${Object.keys(data).length + 1}
              RETURNING *
          `;
          return { query, values };
      };

        //Actualiza tabla Usuario
        if (Object.keys(usuarioData).length > 0) {
            console.log('Actualizando usuario con datos:', usuarioData);
            const usuarioNormalized = this.normalizeFields(fieldMappings.usuario, usuarioData);
            
            if (Object.keys(usuarioNormalized).length > 0) {
                const setClause = Object.keys(usuarioNormalized)
                    .map((key, index) => `"${key}" = $${index + 1}`)
                    .join(', ');
                
                const updateUserQuery = `
                    UPDATE "Usuario"
                    SET ${setClause}
                    WHERE "Id_Usuario" = $${Object.keys(usuarioNormalized).length + 1}
                    RETURNING *
                `;
                
                const values = [...Object.values(usuarioNormalized), userId];
                console.log('Query Usuario:', updateUserQuery);
                console.log('Valores Usuario:', values);
                
                const result = await client.query(updateUserQuery, values);
                console.log('Resultado actualización usuario:', result.rows);
            }
        }

        //Actualiza tabla Contacto
        if (Object.keys(contactoData).length > 0) {
            console.log('Actualizando contacto con datos:', contactoData);
            const contactoNormalized = this.normalizeFields(fieldMappings.contacto, contactoData);
            
            if (Object.keys(contactoNormalized).length > 0) {
                const checkContact = await client.query(
                    'SELECT * FROM "Contacto" WHERE "Id_Usuario" = $1',
                    [userId]
                );
                
                const setClause = Object.keys(contactoNormalized)
                    .map((key, index) => `"${key}" = $${index + 1}`)
                    .join(', ');
                    
                if (checkContact.rowCount === 0) {
                    const insertQuery = `
                        INSERT INTO "Contacto" ("Id_Usuario", ${Object.keys(contactoNormalized).map(k => `"${k}"`).join(', ')})
                        VALUES ($1, ${Object.keys(contactoNormalized).map((_, i) => `$${i + 2}`).join(', ')})
                        RETURNING *
                    `;
                    const values = [userId, ...Object.values(contactoNormalized)];
                    console.log('Query Insert Contacto:', insertQuery);
                    console.log('Valores Insert Contacto:', values);
                    
                    const result = await client.query(insertQuery, values);
                    console.log('Resultado inserción contacto:', result.rows);
                } else {
                    const updateQuery = `
                        UPDATE "Contacto"
                        SET ${setClause}
                        WHERE "Id_Usuario" = $${Object.keys(contactoNormalized).length + 1}
                        RETURNING *
                    `;
                    const values = [...Object.values(contactoNormalized), userId];
                    console.log('Query Update Contacto:', updateQuery);
                    console.log('Valores Update Contacto:', values);
                    
                    const result = await client.query(updateQuery, values);
                    console.log('Resultado actualización contacto:', result.rows);
                }
            }
        }

         //Obtiene Id_Formacion e Id_Empresa desde la tabla Empleo
        const empleoResult = await client.query(
          `SELECT "Id_Formacion", "Id_Empresa" FROM "Empleo" WHERE "Id_Usuario" = $1`,
          [userId]
        );
        const { Id_Formacion, Id_Empresa } = empleoResult.rows[0] || {};

        //Actualiza tabla Empleo
        if (data.empleo && Object.keys(data.empleo).length > 0) {
            const empleoData = this.normalizeFields(fieldMappings.empleo, data.empleo);
            if (Object.keys(empleoData).length > 0) {
                const { query, values } = generateUpdateQuery('Empleo', empleoData, 'Id_Usuario');
                await client.query(query, values);
            }
        }

        //Actualiza tabla Formacion
        if (data.formacion && Id_Formacion && Object.keys(data.formacion).length > 0) {
            const formacionData = this.normalizeFields(fieldMappings.formacion, data.formacion);
            if (Object.keys(formacionData).length > 0) {
                const { query, values } = generateUpdateQuery('Formacion', formacionData, 'Id_Formacion');
                await client.query(query, [...values.slice(0, -1), Id_Formacion]);
            }
        }

        //Actualiza tabla Empresa
        if (data.empresa && Id_Empresa && Object.keys(data.empresa).length > 0) {
            const empresaData = this.normalizeFields(fieldMappings.empresa, data.empresa);
            if (Object.keys(empresaData).length > 0) {
                const { query, values } = generateUpdateQuery('Empresa', empresaData, 'Id_Empresa');
                await client.query(query, [...values.slice(0, -1), Id_Empresa]);
            }
        }

        await client.query('COMMIT');
    } catch (error) {
        await client.query('ROLLBACK');
        console.error('Error al actualizar los datos del usuario:', error);
        console.error('Error detallado:', {
          message: error.message,
          stack: error.stack,
          detail: error.detail,
          where: error.where,
          code: error.code
      });
        throw new Error('Error al actualizar los datos del usuario: ' + error.message);
    } finally {
        client.release();
    }
}
//Método para actualizar usuario y sus datos relacionados.
async updateUser(userId: number, updatedData: any, pdfFile?: Express.Multer.File): Promise<void> {
  const {
    nombre,
    apellido,
    email,
    fecha_nacimiento,
    contraseña,
    telefono,
    domicilio,
    ciudad,
    pais,
    formacion,
    empresa,
    empleo
  } = updatedData;

  try {
    console.log('Actualizando usuario con ID:', userId);
    console.log('Datos a actualizar:', updatedData);

    //1. Actualizar Usuario
    const userQuery = `
      UPDATE "Usuario"
      SET "Nombre" = $1, "Apellido" = $2, "Email" = $3, "Fecha_Nacimiento" = $4, "Contraseña" = $5
      WHERE "Id_Usuario" = $6
    `;
    const userValues = [nombre, apellido, email, fecha_nacimiento, contraseña, userId];
    await this.pool.query(userQuery, userValues);

    //2. Actualizar Contacto
    if (telefono || domicilio || ciudad || pais) {
      const contactoQuery = `
        UPDATE "Contacto"
        SET "Telefono" = $1, "Domicilio" = $2, "Ciudad" = $3, "Pais" = $4
        WHERE "Id_Usuario" = $5
      `;
      const contactoValues = [telefono, domicilio, ciudad, pais, userId];
      await this.pool.query(contactoQuery, contactoValues);
    }

    //3. Actualizar Formación
    if (formacion) {
      const { nombre, descripcion, nivel, institucion, duracion, fecha_titulo, activo, identificador_archivo } = formacion;
      
      const existingFormacion = await this.pool.query(`
        SELECT f."Id_Formacion" 
        FROM "Formacion" f
        INNER JOIN "Empleo" e ON e."Id_Formacion" = f."Id_Formacion"
        WHERE e."Id_Usuario" = $1 LIMIT 1`,
        [userId]
      );

      if (existingFormacion.rows.length > 0) {
        const formacionId = existingFormacion.rows[0].Id_Formacion;
        const formacionQuery = `
          UPDATE "Formacion"
          SET "Nombre" = $1, "Descripcion" = $2, "Nivel" = $3, "Institucion" = $4, 
              "Duracion" = $5, "Fecha_Titulo" = $6, "Activo" = $7, "Identificador_Archivo" = $8
          WHERE "Id_Formacion" = $9`;
        const formacionValues = [nombre, descripcion, nivel, institucion, duracion, fecha_titulo, activo, identificador_archivo, formacionId];
        await this.pool.query(formacionQuery, formacionValues);
      } else {
        const formacionInsertQuery = `
          INSERT INTO "Formacion" ("Nombre", "Descripcion", "Nivel", "Institucion", "Duracion", "Fecha_Titulo", "Activo", "Identificador_Archivo")
          VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
          RETURNING "Id_Formacion"`;
        const formacionValues = [nombre, descripcion, nivel, institucion, duracion, fecha_titulo, activo, identificador_archivo];
        const newFormacion = await this.pool.query(formacionInsertQuery, formacionValues);
        const newFormacionId = newFormacion.rows[0].Id_Formacion;

        await this.pool.query(
          `UPDATE "Empleo" SET "Id_Formacion" = $1 WHERE "Id_Usuario" = $2`,
          [newFormacionId, userId]
        );
      }
    }

    //4. Actualizar Empresa
    if (empresa) {
      const { nombre, razon_social, direccion, ciudad, pais, telefono, email, sitio_web, industria, estado } = empresa;
      
      const existingEmpresa = await this.pool.query(`
        SELECT e."Id_Empresa"
        FROM "Empresa" e
        INNER JOIN "Empleo" emp ON emp."Id_Empresa" = e."Id_Empresa"
        WHERE emp."Id_Usuario" = $1 LIMIT 1`,
        [userId]
      );

      if (existingEmpresa.rows.length > 0) {
        const empresaId = existingEmpresa.rows[0].Id_Empresa;
        const empresaQuery = `
          UPDATE "Empresa"
          SET "Nombre" = $1, "Razon_Social" = $2, "Direccion" = $3, "Ciudad" = $4, 
              "Pais" = $5, "Telefono" = $6, "Email" = $7, "Sitio_Web" = $8, "Industria" = $9, "Estado" = $10
          WHERE "Id_Empresa" = $11`;
        const empresaValues = [nombre, razon_social, direccion, ciudad, pais, telefono, email, sitio_web, industria, estado, empresaId];
        await this.pool.query(empresaQuery, empresaValues);
      } else {
        const empresaInsertQuery = `
          INSERT INTO "Empresa" ("Nombre", "Razon_Social", "Direccion", "Ciudad", "Pais", "Telefono", "Email", "Sitio_Web", "Industria", "Estado")
          VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
          RETURNING "Id_Empresa"`;
        const empresaValues = [nombre, razon_social, direccion, ciudad, pais, telefono, email, sitio_web, industria, estado];
        const newEmpresa = await this.pool.query(empresaInsertQuery, empresaValues);
        const newEmpresaId = newEmpresa.rows[0].Id_Empresa;

        await this.pool.query(
          `UPDATE "Empleo" SET "Id_Empresa" = $1 WHERE "Id_Usuario" = $2`,
          [newEmpresaId, userId]
        );
      }
    }

    //5. Actualizar Empleo
    if (empleo) {
      let { fecha_inicio, fecha_fin, posicion, activo } = empleo;
      fecha_fin = fecha_fin === '' ? null : fecha_fin;
      posicion = posicion === '' ? null : posicion;

      const existingEmpleo = await this.pool.query(
        `SELECT "Id_Empleo" FROM "Empleo" WHERE "Id_Usuario" = $1 LIMIT 1`,
        [userId]
      );

      if (existingEmpleo.rows.length > 0) {
        const empleoId = existingEmpleo.rows[0].Id_Empleo;
        const empleoQuery = `
          UPDATE "Empleo"
          SET "Fecha_Inicio" = $1, "Fecha_Fin" = $2, "Posicion" = $3, "Activo" = $4
          WHERE "Id_Empleo" = $5`;
        const empleoValues = [fecha_inicio, fecha_fin, posicion, activo, empleoId];
        await this.pool.query(empleoQuery, empleoValues);
      } else {
        const empleoInsertQuery = `
          INSERT INTO "Empleo" ("Fecha_Inicio", "Fecha_Fin", "Posicion", "Activo", "Id_Usuario")
          VALUES ($1, $2, $3, $4, $5)
          RETURNING "Id_Empleo"`;
        const empleoValues = [fecha_inicio, fecha_fin, posicion, activo, userId];
        await this.pool.query(empleoInsertQuery, empleoValues);
      }
    }

    console.log('Actualización completada.');
  } catch (error) {
    console.error('Error al actualizar el usuario y sus relaciones:', error);
    throw new BadRequestException('Error al actualizar el usuario y sus relaciones');
  }
}
  
//Método para eliminar usuario y sus datos relacionados.
async deleteUser(userId: number): Promise<void> {
    const client = await this.pool.connect();
    
    try {
      await client.query('BEGIN');
      
      //Elimina los empleos relacionados, asegurando eliminar también la empresa y la formación si no se usan en otro lugar.
      await client.query(
        `DELETE FROM "Empleo" WHERE "Id_Usuario" = $1`,
        [userId]
      );
  
      //Elimina los registros en la tabla Empresa relacionados con el usuario si la empresa no está asociada a otro usuario.
      await client.query(
        `DELETE FROM "Empresa" 
         WHERE "Id_Empresa" IN (SELECT "Id_Empresa" FROM "Empleo" WHERE "Id_Usuario" = $1)`,
        [userId]
      );
  
      //Elimina las formaciones relacionadas si no están asociadas a otros usuarios o registros.
      await client.query(
        `DELETE FROM "Formacion" 
         WHERE "Id_Formacion" IN (SELECT "Id_Formacion" FROM "Empleo" WHERE "Id_Usuario" = $1)`,
        [userId]
      );
  
      //Luego elimina el contacto relacionado.
      await client.query(
        `DELETE FROM "Contacto" WHERE "Id_Usuario" = $1`,
        [userId]
      );
  
      //Finalmente elimina el usuario.
      await client.query(
        `DELETE FROM "Usuario" WHERE "Id_Usuario" = $1`,
        [userId]
      );
  
      await client.query('COMMIT');
    } catch (error) {
      await client.query('ROLLBACK');
      console.error('Error al eliminar el usuario:', error);
      throw new Error('Error al eliminar el usuario: ' + error.message);
    } finally {
      client.release();
    }
  }  
}
