import { Injectable, Inject, BadRequestException } from '@nestjs/common';
import { Pool } from 'pg';
import * as fs from 'fs';
import * as path from 'path';

@Injectable()
export class UserService {
  constructor(@Inject('DATABASE_CONNECTION') private readonly pool: Pool) {}

  //Función para normalizar los nombres de los campos
  private normalizeFields(tableFields: Record<string, string>, inputData: any): any {
    return Object.keys(inputData).reduce((acc, key) => {
      //Normalización para manejar "contraseña" de manera especial
      let normalizedKey = key.toLowerCase() === 'contraseña' ? 'Contraseña' : tableFields[key.toLowerCase()] || key;
      
      //Verificación para campos de tipo fecha (Date)
      if (normalizedKey.toLowerCase().includes('fecha') && (inputData[key] === '' || inputData[key] === null)) {
        acc[normalizedKey] = null; // Asignar NULL si el valor de fecha está vacío
      } else {
        acc[normalizedKey] = inputData[key];
      }

      return acc;
    }, {} as any);
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

    if (!nombre || !apellido || !fecha_nacimiento || !email || !contraseña) {
      throw new Error('Faltan datos obligatorios: nombre, apellido, fecha de nacimiento, email y/o contraseña.');
    }

    const client = await this.pool.connect();
    try {
      await client.query('BEGIN'); // Inicia la transacción

      //Paso 1: Inserta el Usuario
      const userResult = await client.query(
        `INSERT INTO "Usuario" ("Nombre", "Apellido", "Fecha_Nacimiento", "Email", "Contraseña", "Fecha_Creacion") 
         VALUES ($1, $2, $3, $4, $5, NOW()) RETURNING "Id_Usuario"`,
        [nombre, apellido, fecha_nacimiento, email, contraseña]
      );
      const usuarioId = userResult.rows[0].Id_Usuario;

      //Paso 2: Inserta el Contacto (opcional)
      if (telefono || domicilio || ciudad || pais) {
        await client.query(
          `INSERT INTO "Contacto" ("Id_Usuario", "Telefono", "Domicilio", "Ciudad", "Pais") 
           VALUES ($1, $2, $3, $4, $5)`,
          [usuarioId, telefono || null, domicilio || null, ciudad || null, pais || null]
        );
      }

      //Paso 3: Inserta la Formacion (opcional)
      let formacionId = null;
      if (formacion) {
        const { nombre, descripcion, nivel, institucion, duracion, fecha_titulo, activo, identificador_archivo } = formacion;
        const formacionResult = await client.query(
          `INSERT INTO "Formacion" ("Nombre", "Descripcion", "Nivel", "Institucion", "Duracion", "Fecha_Titulo", "Activo", "Identificador_Archivo") 
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING "Id_Formacion"`,
          [nombre, descripcion || null, nivel || null, institucion || null, duracion || null, fecha_titulo || null, activo || true, identificador_archivo || null]
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
          [nombre, razon_social || null, direccion || null, ciudad || null, pais || null, telefono || null, email || null, sitio_web || null, industria || null, estado || true]
        );
        empresaId = empresaResult.rows[0].Id_Empresa;
      }

      //Paso 5: Inserta el Empleo (opcional, depende de usuario, empresa, y formacion)
      if (empleo) {
        const { fecha_inicio, fecha_fin, posicion, activo } = empleo;
        await client.query(
          `INSERT INTO "Empleo" ("Id_Usuario", "Id_Empresa", "Id_Formacion", "Fecha_Inicio", "Fecha_Fin", "Posicion", "Activo") 
           VALUES ($1, $2, $3, $4, $5, $6, $7)`,
          [usuarioId, empresaId || null, formacionId || null, fecha_inicio || null, fecha_fin || null, posicion || null, activo || true]
        );
      }

      await client.query('COMMIT'); //Confirma la transacción

    } catch (error) {
      await client.query('ROLLBACK'); //Revierte si hay error
      console.error('Error al crear el usuario:', error);
      throw new Error('Error al crear el usuario: ' + error.message);
    } finally {
      client.release(); //Libera conexión
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

// Método para actualizar los datos de un usuario
async updateUserFields(userId: number, data: any): Promise<void> {
    const client = await this.pool.connect();
    try {
        await client.query('BEGIN');

        // Mapeo de campos de la base de datos
        const fieldMappings = {
            "usuario": {
                "nombre": "Nombre",
                "apellido": "Apellido",
                "fecha_nacimiento": "Fecha_Nacimiento",
                "email": "Email",
                "contraseña": "Contraseña",
            },
            "contacto": {
                "telefono": "Telefono",
                "domicilio": "Domicilio",
                "ciudad": "Ciudad",
                "pais": "Pais",
            },
            "formacion": {
                "nombre": "Nombre",
                "descripcion": "Descripcion",
                "nivel": "Nivel",
                "institucion": "Institucion",
                "duracion": "Duracion",
                "fecha_titulo": "Fecha_Titulo",
                "activo": "Activo",
                "identificador_archivo": "Identificador_Archivo",
            },
            "empresa": {
                "nombre": "Nombre",
                "razon_social": "Razon_Social",
                "direccion": "Direccion",
                "ciudad": "Ciudad",
                "pais": "Pais",
                "telefono": "Telefono",
                "email": "Email",
                "sitio_web": "Sitio_Web",
                "industria": "Industria",
                "estado": "Estado",
            },
            "empleo": {
                "fecha_inicio": "Fecha_Inicio",
                "fecha_fin": "Fecha_Fin",
                "posicion": "Posicion",
                "activo": "Activo",
            },
        };

        // Actualiza tabla Usuario
        if (data.usuario) {
            const usuarioData = this.normalizeFields(fieldMappings.usuario, data.usuario);
            const updateUserQuery = `
                UPDATE "Usuario" SET ${Object.keys(usuarioData)
                    .map((key, index) => `"${key}" = $${index + 1}`)
                    .join(', ')}
                WHERE "Id_Usuario" = $${Object.keys(usuarioData).length + 1}
            `;
            await client.query(updateUserQuery, [...Object.values(usuarioData), userId]);
        }

        // Actualiza tabla Contacto
        if (data.contacto) {
            const contactoData = this.normalizeFields(fieldMappings.contacto, data.contacto);
            const updateContactQuery = `
                UPDATE "Contacto" SET ${Object.keys(contactoData)
                    .map((key, index) => `"${key}" = $${index + 1}`)
                    .join(', ')}
                WHERE "Id_Usuario" = $${Object.keys(contactoData).length + 1}
            `;
            await client.query(updateContactQuery, [...Object.values(contactoData), userId]);
        }

        // Obtiene Id_Formacion e Id_Empresa desde la tabla Empleo
        const empleoResult = await client.query(
            `SELECT "Id_Formacion", "Id_Empresa" FROM "Empleo" WHERE "Id_Usuario" = $1`,
            [userId]
        );
        const { Id_Formacion, Id_Empresa } = empleoResult.rows[0] || {};

        // Actualiza tabla Empleo
        if (data.empleo) {
            const empleoData = this.normalizeFields(fieldMappings.empleo, data.empleo);
            const updateEmpleoQuery = `
                UPDATE "Empleo" SET ${Object.keys(empleoData)
                    .map((key, index) => `"${key}" = $${index + 1}`)
                    .join(', ')}
                WHERE "Id_Usuario" = $${Object.keys(empleoData).length + 1}
            `;
            await client.query(updateEmpleoQuery, [...Object.values(empleoData), userId]);
        }

        // Actualiza tabla Formacion
        if (data.formacion && Id_Formacion) {
            const formacionData = this.normalizeFields(fieldMappings.formacion, data.formacion);
            const updateFormacionQuery = `
                UPDATE "Formacion" SET ${Object.keys(formacionData)
                    .map((key, index) => `"${key}" = $${index + 1}`)
                    .join(', ')}
                WHERE "Id_Formacion" = $${Object.keys(formacionData).length + 1}
            `;
            await client.query(updateFormacionQuery, [...Object.values(formacionData), Id_Formacion]);
        }

        // Actualiza tabla Empresa
        if (data.empresa && Id_Empresa) {
            const empresaData = this.normalizeFields(fieldMappings.empresa, data.empresa);
            const updateEmpresaQuery = `
                UPDATE "Empresa" SET ${Object.keys(empresaData)
                    .map((key, index) => `"${key}" = $${index + 1}`)
                    .join(', ')}
                WHERE "Id_Empresa" = $${Object.keys(empresaData).length + 1}
            `;
            await client.query(updateEmpresaQuery, [...Object.values(empresaData), Id_Empresa]);
        }

        await client.query('COMMIT');
    } catch (error) {
        await client.query('ROLLBACK');
        console.error('Error al actualizar los datos del usuario:', error);
        throw new Error('Error al actualizar los datos del usuario: ' + error.message);
    } finally {
        client.release();
    }
}

async updateUser(userId: number, updatedData: any): Promise<void> {
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
  
      // 1. Actualizar la tabla Usuario
      const userQuery = `
        UPDATE "Usuario"
        SET "Nombre" = $1, "Apellido" = $2, "Email" = $3, "Fecha_Nacimiento" = $4, "Contraseña" = $5
        WHERE "Id_Usuario" = $6
      `;
      const userValues = [nombre, apellido, email, fecha_nacimiento, contraseña, userId];
      console.log('Ejecutando consulta para Usuario:', userQuery, userValues);
      await this.pool.query(userQuery, userValues);
  
      // 2. Actualizar la tabla Contacto
      if (telefono || domicilio || ciudad || pais) {
        const contactoQuery = `
          UPDATE "Contacto"
          SET "Telefono" = $1, "Domicilio" = $2, "Ciudad" = $3, "Pais" = $4
          WHERE "Id_Usuario" = $5
        `;
        const contactoValues = [telefono, domicilio, ciudad, pais, userId];
        console.log('Ejecutando consulta para Contacto:', contactoQuery, contactoValues);
        await this.pool.query(contactoQuery, contactoValues);
      }
  
        // 3. Verificar si el usuario tiene un empleo y actualizar o insertar
        let empleoId: number | null = null;
        if (empleo) {
        let { fecha_inicio, fecha_fin, posicion, activo } = empleo;

        // Conversión de campos vacíos a NULL
        if (fecha_fin === '') {
            console.log('Campo "fecha_fin" vacío, lo convirtiendo a NULL');
            fecha_fin = null;
        }
        if (posicion === '') {
            console.log('Campo "posicion" vacío, lo convirtiendo a NULL');
            posicion = null;
        }

        console.log('Verificando si el usuario tiene un empleo existente...');
        const existingEmpleo = await this.pool.query(
            `SELECT "Id_Empleo" FROM "Empleo" WHERE "Id_Usuario" = $1 LIMIT 1`,
            [userId]
        );

        if (existingEmpleo.rows.length > 0) {
            // Si existe un empleo, actualizarlo
            console.log('Empleo existente encontrado, actualizando...');
            empleoId = existingEmpleo.rows[0]["Id_Empleo"]; // Accede al campo correctamente
        
            const empleoQuery = `
                UPDATE "Empleo"
                SET "Fecha_Inicio" = $1, "Fecha_Fin" = $2, "Posicion" = $3, "Activo" = $4
                WHERE "Id_Empleo" = $5
            `;
            const empleoValues = [fecha_inicio, fecha_fin, posicion, activo, empleoId];
            console.log('Ejecutando consulta para Empleo (actualización):', empleoQuery, empleoValues);
            await this.pool.query(empleoQuery, empleoValues);
        } else {
            // Si no existe un empleo, insertar uno nuevo
            console.log('No se encontró empleo existente, insertando uno nuevo...');
            const empleoInsertQuery = `
                INSERT INTO "Empleo" ("Fecha_Inicio", "Fecha_Fin", "Posicion", "Activo", "Id_Usuario")
                VALUES ($1, $2, $3, $4, $5) RETURNING "Id_Empleo"
            `;
            const empleoValues = [fecha_inicio, fecha_fin, posicion, activo, userId];
            console.log('Ejecutando consulta para Empleo (inserción):', empleoInsertQuery, empleoValues);
            const result = await this.pool.query(empleoInsertQuery, empleoValues);
            empleoId = result.rows[0]["Id_Empleo"]; // Accede al campo correctamente
        }        
        }

      // 4. Insertar o actualizar la tabla Formacion
      if (formacion) {
        const { nombre: nombreFormacion, descripcion, nivel, institucion, duracion, fecha_titulo, activo, identificador_archivo } = formacion;
  
        // Verificar si la formación ya está registrada
        const existingFormacion = await this.pool.query(
          `SELECT "Id_Formacion" FROM "Formacion" WHERE "Id_Formacion" = $1 LIMIT 1`,
          [empleoId]
        );
  
        if (existingFormacion.rows.length > 0) {
          // Si la formación existe, actualizarla
          const formacionQuery = `
            UPDATE "Formacion"
            SET "Nombre" = $1, "Descripcion" = $2, "Nivel" = $3, "Institucion" = $4, "Duracion" = $5, "Fecha_Titulo" = $6, "Activo" = $7, "Identificador_Archivo" = $8
            WHERE "Id_Formacion" = $9
          `;
          const formacionValues = [
            nombreFormacion, descripcion, nivel, institucion, duracion, fecha_titulo, activo, identificador_archivo,
            existingFormacion.rows[0].id_formacion
          ];
          console.log('Ejecutando consulta para Formacion (actualización):', formacionQuery, formacionValues);
          await this.pool.query(formacionQuery, formacionValues);
        } else {
          // Si no existe la formación, insertarla
          const formacionInsertQuery = `
            INSERT INTO "Formacion" ("Nombre", "Descripcion", "Nivel", "Institucion", "Duracion", "Fecha_Titulo", "Activo", "Identificador_Archivo")
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING "Id_Formacion"
          `;
          const formacionValues = [nombreFormacion, descripcion, nivel, institucion, duracion, fecha_titulo, activo, identificador_archivo];
          console.log('Ejecutando consulta para Formacion (inserción):', formacionInsertQuery, formacionValues);
          await this.pool.query(formacionInsertQuery, formacionValues);
        }
      }
  
      // 5. Insertar o actualizar la tabla Empresa
      if (empresa) {
        const { nombre: nombreEmpresa, razon_social, direccion, ciudad: ciudadEmpresa, pais: paisEmpresa, telefono: telefonoEmpresa, email: emailEmpresa, sitio_web, industria, estado } = empresa;
  
        // Verificar si la empresa ya está registrada
        const existingEmpresa = await this.pool.query(
          `SELECT "Id_Empresa" FROM "Empresa" WHERE "Id_Empresa" = $1 LIMIT 1`,
          [empleoId]
        );
  
        if (existingEmpresa.rows.length > 0) {
          // Si la empresa existe, actualizarla
          const empresaQuery = `
            UPDATE "Empresa"
            SET "Nombre" = $1, "Razon_Social" = $2, "Direccion" = $3, "Ciudad" = $4, "Pais" = $5, "Telefono" = $6, "Email" = $7, "Sitio_Web" = $8, "Industria" = $9, "Estado" = $10
            WHERE "Id_Empresa" = $11
          `;
          const empresaValues = [
            nombreEmpresa, razon_social, direccion, ciudadEmpresa, paisEmpresa, telefonoEmpresa, emailEmpresa, sitio_web, industria, estado,
            existingEmpresa.rows[0].id_empresa
          ];
          console.log('Ejecutando consulta para Empresa (actualización):', empresaQuery, empresaValues);
          await this.pool.query(empresaQuery, empresaValues);
        } else {
          // Si no existe la empresa, insertarla
          const empresaInsertQuery = `
            INSERT INTO "Empresa" ("Nombre", "Razon_Social", "Direccion", "Ciudad", "Pais", "Telefono", "Email", "Sitio_Web", "Industria", "Estado")
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10) RETURNING "Id_Empresa"
          `;
          const empresaValues = [nombreEmpresa, razon_social, direccion, ciudadEmpresa, paisEmpresa, telefonoEmpresa, emailEmpresa, sitio_web, industria, estado];
          console.log('Ejecutando consulta para Empresa (inserción):', empresaInsertQuery, empresaValues);
          await this.pool.query(empresaInsertQuery, empresaValues);
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
