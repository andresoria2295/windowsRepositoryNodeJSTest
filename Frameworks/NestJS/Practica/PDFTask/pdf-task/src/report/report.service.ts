import { Injectable, Inject, BadRequestException } from '@nestjs/common';
import { Pool } from 'pg';
import * as fs from 'fs';
import * as path from 'path';

@Injectable()
export class ReportService {
  constructor(@Inject('DATABASE_CONNECTION') private readonly pool: Pool) {}

  //Método para lectura de datos completos.
  async getUserReport(): Promise<any[]> {
    const query = `
      SELECT u."Nombre", u."Apellido", u."Fecha_Nacimiento", u."Email", c."Telefono", c."Domicilio", c."Ciudad", o."Titulo", o."Empresa", o."Fecha_Inicio"
      FROM "Usuario" u
      INNER JOIN "Contacto" c ON u."Id_Usuario" = c."Id_Usuario"
      LEFT JOIN "Ocupacion" o ON u."Id_Usuario" = o."Id_Usuario"
    `;
    const result = await this.pool.query(query);
    return result.rows;
  }

  //Método para obtención de archivo PDF de un usuario.
async getUserPDF(userId: number): Promise<Buffer | null> {
  console.log(`Intentando descargar PDF para el usuario con ID: ${userId}`);
  
  const result = await this.pool.query(
    `SELECT "Documentacion" FROM "Ocupacion" WHERE "Id_Usuario" = $1`,
    [userId]
  );

  //Verifica si se encontró un registro
  if (result.rows.length === 0) {
    console.log('No se encontró un archivo PDF para este usuario.');
    return null;
  }

  const pdfFile = result.rows[0].Documentacion;
  if (!pdfFile) {
    console.log('El campo Documentacion está vacío.');
    return null;
  }

  console.log('Archivo PDF obtenido de la base de datos:', pdfFile);
  return pdfFile;  //Asegura que es un buffer almacenado en la BD
}

  
  
  async createUser(newUserData: any, file: Express.Multer.File | undefined): Promise<void> {
    console.log('Datos recibidos:', newUserData);
    console.log('Archivo recibido:', file);
  
    //Desestructura los datos recibidos
    let { nombre, apellido, fecha_nacimiento, email, contraseña, telefono, domicilio, ciudad, pais, ocupacion } = newUserData;
  
    //Normaliza contraseñas mal codificadas
    if (!contraseña && newUserData['contraseÃ±a']) {
      contraseña = newUserData['contraseÃ±a'];
    }
  
    //Valida campos obligatorios
    if (!nombre || !apellido || !fecha_nacimiento || !email || !contraseña || !telefono || !domicilio || !ciudad || !pais) {
      throw new Error('Todos los campos obligatorios deben estar presentes');
    }
  
    const client = await this.pool.connect();
  
    try {
      await client.query('BEGIN'); // Inicia transacción
  
      //Inserta datos en la tabla "Usuario"
      const userResult = await client.query(
        `INSERT INTO "Usuario" ("Nombre", "Apellido", "Fecha_Nacimiento", "Email", "Contraseña", "Fecha_Creacion") 
         VALUES ($1, $2, $3, $4, $5, NOW()) RETURNING "Id_Usuario"`,
        [nombre, apellido, fecha_nacimiento, email, contraseña]
      );
  
      const usuarioId = userResult.rows[0].Id_Usuario;
  
      //Inserta datos en la tabla "Contacto"
      await client.query(
        `INSERT INTO "Contacto" ("Id_Usuario", "Telefono", "Domicilio", "Ciudad", "Pais") 
         VALUES ($1, $2, $3, $4, $5)`,
        [usuarioId, telefono, domicilio, ciudad, pais]
      );
  
      //Maneja datos de ocupación si se proporcionan
      if (ocupacion) {
        const { titulo, empresa, fecha_inicio } = ocupacion;
        let documentacion = null;
        let nombreArchivo = null;
  
        //Manejar el archivo PDF si se envió
        if (file) {
          if (file.mimetype !== 'application/pdf') {
            throw new Error('El archivo debe ser un PDF');
          }
  
          try {
            const uploadDir = path.join(__dirname, '..', '..', 'uploads');
            if (!fs.existsSync(uploadDir)) {
              fs.mkdirSync(uploadDir, { recursive: true });
            }
  
            const filePath = path.join(uploadDir, file.originalname);
            fs.writeFileSync(filePath, file.buffer);
  
            //Lee el archivo en formato buffer para la base de datos
            documentacion = fs.readFileSync(filePath);
            nombreArchivo = file.originalname;
          } catch (err) {
            throw new Error('Error al guardar el archivo: ' + err.message);
          }
        }
  
        //Inserta datos en la tabla "Ocupacion"
        await client.query(
          `INSERT INTO "Ocupacion" ("Titulo", "Empresa", "Fecha_Inicio", "Id_Usuario", "Documentacion", "Nombre_Archivo") 
           VALUES ($1, $2, $3, $4, $5, $6)`,
          [titulo, empresa || null, fecha_inicio || null, usuarioId, documentacion, nombreArchivo]
        );
      }
  
      await client.query('COMMIT'); //Confirma transacción
    } catch (error) {
      await client.query('ROLLBACK'); //Revierte cambios si hay un error
      console.error('Error al crear el usuario:', error);
      throw new Error('Error al crear el usuario: ' + error.message);
    } finally {
      client.release(); //Libera conexión
    }
  }
  


  //Método para actualizar todos los campos (UPDATE completo).
  async updateUser(userId: number, updatedData: any): Promise<void> {
    const { nombre, apellido, fecha_nacimiento, email, contraseña, telefono, domicilio, ciudad, pais, ocupacion } = updatedData;

    const client = await this.pool.connect();

    try {
      await client.query('BEGIN');

      //Actualiza la tabla Usuario, permitiendo `NULL`.
      await client.query(
        `UPDATE "Usuario"
         SET "Nombre" = $1, 
             "Apellido" = $2, 
             "Fecha_Nacimiento" = $3, 
             "Email" = $4,
             "Contraseña" = $5
         WHERE "Id_Usuario" = $6`,
        [nombre, apellido, fecha_nacimiento, email, contraseña, userId]
      );

      //Actualiza la tabla Contacto, permitiendo `NULL`.
      await client.query(
        `UPDATE "Contacto"
         SET "Telefono" = $1, 
             "Domicilio" = $2, 
             "Ciudad" = $3, 
             "Pais" = $4
         WHERE "Id_Usuario" = $5`,
        [telefono, domicilio, ciudad, pais, userId]
      );

      //Si se proporciona ocupación, actualiza la tabla Ocupacion, permitiendo `NULL`.
      if (ocupacion) {
        const { titulo, empresa, fecha_inicio, documentacion } = ocupacion;
        await client.query(
          `UPDATE "Ocupacion"
           SET "Titulo" = $1, 
               "Empresa" = $2, 
               "Fecha_Inicio" = $3, 
               "Documentacion" = $4
           WHERE "Id_Usuario" = $5`,
          [titulo, empresa || null, fecha_inicio || null, documentacion || null, userId]
        );
      }

      await client.query('COMMIT');
    } catch (error) {
      await client.query('ROLLBACK');
      console.error('Error al actualizar el usuario:', error);
      throw new Error('Error al actualizar el usuario: ' + error.message);
    } finally {
      client.release();
    }
  }

  async updateFileUser(userId: number, updatedData: any, file: Express.Multer.File): Promise<void> {
    console.log('Datos a actualizar:', updatedData);
    console.log('Archivo recibido:', file);
  
    const client = await this.pool.connect();
  
    try {
      await client.query('BEGIN'); // Iniciar transacción
  
      //Prepara la consulta de actualización
      const updateQuery = `
        UPDATE "Ocupacion" 
        SET "Documentacion" = $1, "Nombre_Archivo" = $2 
        WHERE "Id_Usuario" = $3
      `;
  
      let documentacion = null;
      let nombreArchivo = null;
  
      //Maneja el archivo PDF si se proporcionó
      if (file) {
        //Valida el tipo de archivo
        if (file.mimetype !== 'application/pdf') {
          throw new Error('El archivo debe ser un PDF');
        }
  
        //Lee el archivo en formato buffer para la base de datos
        documentacion = file.buffer;
        nombreArchivo = file.originalname; 
      }
  
      //Ejecuta la actualización
      const result = await client.query(updateQuery, [documentacion, nombreArchivo, userId]);
  
      if (result.rowCount === 0) {
        console.log(`No se actualizó ninguna fila para el usuario con ID ${userId}`);
      } else {
        console.log(`Se actualizó la ocupación para el usuario con ID ${userId}`);
      }
  
      await client.query('COMMIT'); //Confirma transacción
    } catch (error) {
      await client.query('ROLLBACK'); //Revierte cambios si hay un error
      console.error('Error al actualizar ocupacion:', error);
      throw new Error('Error al actualizar ocupacion: ' + error.message);
    } finally {
      client.release(); //Libera conexión
    }
  }

  async updateUserFields(userId: number, updatedData: any): Promise<void> {
    const client = await this.pool.connect();
  
    try {
      await client.query('BEGIN');
  
      //Actualiza la tabla Usuario
      const userUpdateFields: string[] = [];
      const userUpdateValues: any[] = [];
      let index = 1;
  
      if (updatedData.nombre !== undefined) {
        userUpdateFields.push(`"Nombre" = $${index}`);
        userUpdateValues.push(updatedData.nombre);
        index++;
      }
      if (updatedData.apellido !== undefined) {
        userUpdateFields.push(`"Apellido" = $${index}`);
        userUpdateValues.push(updatedData.apellido);
        index++;
      }
      if (updatedData.fecha_nacimiento !== undefined) {
        userUpdateFields.push(`"Fecha_Nacimiento" = $${index}`);
        userUpdateValues.push(updatedData.fecha_nacimiento);
        index++;
      }
      if (updatedData.email !== undefined) {
        userUpdateFields.push(`"Email" = $${index}`);
        userUpdateValues.push(updatedData.email);
        index++;
      }
      if (updatedData.contraseña !== undefined) {
        userUpdateFields.push(`"Contraseña" = $${index}`);
        userUpdateValues.push(updatedData.contraseña);
        index++;
      }
  
      //Actualiza en la tabla Usuario si hay campos a actualizar
      if (userUpdateFields.length > 0) {
        const userUpdateQuery = `UPDATE "Usuario" SET ${userUpdateFields.join(', ')} WHERE "Id_Usuario" = $${index}`;
        userUpdateValues.push(userId); //Se agrega el ID del usuario para el WHERE
        await client.query(userUpdateQuery, userUpdateValues);
      }
  
      //Actualiza la tabla Contacto
      const contactoUpdateFields: string[] = [];
      const contactoUpdateValues: any[] = [];
  
      if (updatedData.telefono !== undefined) {
        contactoUpdateFields.push(`"Telefono" = $${index}`);
        contactoUpdateValues.push(updatedData.telefono);
        index++;
      }
      if (updatedData.domicilio !== undefined) {
        contactoUpdateFields.push(`"Domicilio" = $${index}`);
        contactoUpdateValues.push(updatedData.domicilio);
        index++;
      }
      if (updatedData.ciudad !== undefined) {
        contactoUpdateFields.push(`"Ciudad" = $${index}`);
        contactoUpdateValues.push(updatedData.ciudad);
        index++;
      }
      if (updatedData.pais !== undefined) {
        contactoUpdateFields.push(`"Pais" = $${index}`);
        contactoUpdateValues.push(updatedData.pais);
        index++;
      }
  
      if (contactoUpdateFields.length > 0) {
        const contactoUpdateQuery = `UPDATE "Contacto" SET ${contactoUpdateFields.join(', ')} WHERE "Id_Usuario" = $${index}`;
        contactoUpdateValues.push(userId);
        await client.query(contactoUpdateQuery, contactoUpdateValues);
      }
  
      //Actualizar la tabla Ocupacion
      const occupationFields: string[] = [];
      const occupationValues: any[] = [];
      let occupationIndex = 1;
  
      if (updatedData.titulo !== undefined) {
        occupationFields.push(`"Titulo" = $${occupationIndex}`);
        occupationValues.push(updatedData.titulo);
        occupationIndex++;
      }
      if (updatedData.empresa !== undefined) {
        occupationFields.push(`"Empresa" = $${occupationIndex}`);
        occupationValues.push(updatedData.empresa);
        occupationIndex++;
      }
      if (updatedData.fecha_inicio !== undefined) {
        occupationFields.push(`"Fecha_Inicio" = $${occupationIndex}`);
        occupationValues.push(updatedData.fecha_inicio);
        occupationIndex++;
      }
      if (updatedData.documentacion !== undefined) {
        occupationFields.push(`"Documentacion" = $${occupationIndex}`);
        occupationValues.push(updatedData.documentacion);
        occupationIndex++;
      }
  
      const occupationCheckQuery = `SELECT * FROM "Ocupacion" WHERE "Id_Usuario" = $1`;
      const occupationCheckResult = await client.query(occupationCheckQuery, [userId]);
  
      if (occupationCheckResult.rows.length > 0) {
        if (occupationFields.length > 0) {
          const occupationUpdateQuery = `UPDATE "Ocupacion" SET ${occupationFields.join(', ')} WHERE "Id_Usuario" = $${occupationIndex}`;
          occupationValues.push(userId);
          await client.query(occupationUpdateQuery, occupationValues);
        }
      } else {
        const occupationInsertFields = `"Id_Usuario", ${occupationFields.map(f => f.split(' ')[0]).join(', ')}`;
        const occupationInsertValues = [userId, ...occupationValues];
        const occupationInsertPlaceholders = occupationInsertValues.map((_, idx) => `$${idx + 1}`).join(', ');
  
        const occupationInsertQuery = `INSERT INTO "Ocupacion" (${occupationInsertFields}) VALUES (${occupationInsertPlaceholders})`;
        await client.query(occupationInsertQuery, occupationInsertValues);
      }
  
      await client.query('COMMIT');
    } catch (error) {
      await client.query('ROLLBACK');
      console.error('Error al actualizar:', error);
      throw new Error('Error al actualizar: ' + error.message);
    } finally {
      client.release();
    }
  }  

  //Método para eliminar usuario.
  async deleteUser(userId: number): Promise<void> {
    const client = await this.pool.connect();
    
    try {
      await client.query('BEGIN');
  
      //Primero elimina la ocupación relacionada si existe
      await client.query(
        `DELETE FROM "Ocupacion" WHERE "Id_Usuario" = $1`,
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

  //Reportes de ocupaciones agrupadas por puestos.
  async getGroupedOccupations(): Promise<any[]> {
    const query = `
      SELECT 
        o."Titulo",
        COUNT(u."Id_Usuario") AS cantidad_usuarios
      FROM 
        "Ocupacion" o
      JOIN 
        "Usuario" u ON o."Id_Usuario" = u."Id_Usuario"
      GROUP BY 
        o."Titulo";
    `;
    const result = await this.pool.query(query);
    return result.rows; 
  }

  //Reportes de ocupaciones agrupadas por puestos y empresas.
  async getOccupationsByTitleAndCompany(): Promise<any[]> {
    const query = `
      SELECT 
        o."Titulo",
        o."Empresa",
        COUNT(u."Id_Usuario") AS cantidad_usuarios
      FROM 
        "Ocupacion" o
      JOIN 
        "Usuario" u ON o."Id_Usuario" = u."Id_Usuario"
      GROUP BY 
        o."Titulo", o."Empresa";
    `;
    const result = await this.pool.query(query);
    return result.rows; 
  }

  //Reporte de Usuarios por Ocupación.
  async getUsersByOccupation(): Promise<any[]> {
    const query = `
      SELECT 
        u."Nombre",
        u."Apellido",
        o."Titulo",
        o."Empresa"
      FROM 
        "Usuario" u
      JOIN 
        "Ocupacion" o ON u."Id_Usuario" = o."Id_Usuario"
      ORDER BY 
        o."Titulo";
    `;
    const result = await this.pool.query(query);
    return result.rows;
  }

  //Reportes de usuarios nuevos por mes.
  async getMonthlyNewUsers(): Promise<any[]> {
    const query = `
    SELECT 
    DATE_TRUNC('month', u."Fecha_Creacion") AS mes,
    COUNT(*) AS cantidad_usuarios
    FROM 
    "Usuario" u
    GROUP BY 
    mes
    ORDER BY 
    mes DESC;
    `;
    const result = await this.pool.query(query);
    return result.rows;
  }

  //Reporte de Ocupaciones sin Documentación.
  async getUndocumented(): Promise<any[]> {
    const query = `
    SELECT 
      u."Nombre",
      u."Apellido",
      o."Titulo"
    FROM 
      "Ocupacion" o
    JOIN 
      "Usuario" u ON o."Id_Usuario" = u."Id_Usuario"
    WHERE 
      o."Documentacion" IS NULL;
    `;
    const result = await this.pool.query(query);
    return result.rows;
  }

  //Reporte de Usuarios informales en la actualidad.
  async getInformalUsers(): Promise<any[]> {
    const query = `
    SELECT 
      u."Nombre", 
      u."Apellido", 
      o."Titulo", 
      o."Empresa"
    FROM 
      "Usuario" u
    JOIN 
      "Ocupacion" o ON u."Id_Usuario" = o."Id_Usuario"
    WHERE 
      o."Empresa" = 'Particular'
    GROUP BY 
      u."Nombre", 
      u."Apellido", 
      o."Titulo", 
      o."Empresa";
    `;
    const result = await this.pool.query(query);
    return result.rows;
  }

  //Reporte de Usuarios informales desde que fueron matriculados (sin otras empresas registradas)
  async getPerpetualInformalUsers(): Promise<any[]> {
    const query = `
    SELECT 
      u."Nombre", 
      u."Apellido"
    FROM 
      "Usuario" u
    JOIN 
      "Ocupacion" o ON u."Id_Usuario" = o."Id_Usuario"
    GROUP BY 
      u."Id_Usuario"
    HAVING 
      COUNT(CASE WHEN o."Empresa" <> 'Particular' THEN 1 END) = 0;
    `;
    const result = await this.pool.query(query);
    return result.rows;
  }

  //Reporte de Usuarios mayores de 50 años.
  async getOlderUsers(): Promise<any[]> {
    const query = `
    SELECT 
      u."Nombre", 
      u."Apellido", 
      u."Fecha_Nacimiento"
    FROM 
      "Usuario" u
    WHERE 
    DATE_PART('year', AGE(u."Fecha_Nacimiento")) > 45;
    `;
    const result = await this.pool.query(query);
    return result.rows;
  }
  //Reporte de Usuarios menores de 35 años.
  async getYoungerUsers(): Promise<any[]> {
    const query = `
    SELECT 
      u."Nombre", 
      u."Apellido", 
      u."Fecha_Nacimiento"
    FROM 
      "Usuario" u
    WHERE 
    DATE_PART('year', AGE(u."Fecha_Nacimiento")) < 35;
    `;
    const result = await this.pool.query(query);
    return result.rows;
  }
  //Reporte de Usuarios que comenzaron a trabajar desde el año 2015.
  async getStartWorking(): Promise<any[]> {
    const query = `
    SELECT 
      u."Nombre", 
      u."Apellido", 
      o."Titulo", 
      o."Empresa", 
      o."Fecha_Inicio"
    FROM 
      "Usuario" u
    JOIN 
      "Ocupacion" o ON u."Id_Usuario" = o."Id_Usuario"
    WHERE 
      o."Fecha_Inicio" > '2014-12-31'; 
    `;
    const result = await this.pool.query(query);
    return result.rows;
  }
  //Reporte de Usuarios que comenzaron a trabajar en la formalidad ordenados en forma creciente.
  async getFormalJob(): Promise<any[]> {
    const query = `
    SELECT 
      u."Nombre", 
      u."Apellido", 
      o."Titulo", 
      o."Empresa", 
      o."Fecha_Inicio"
    FROM 
      "Usuario" u
    JOIN 
      "Ocupacion" o ON u."Id_Usuario" = o."Id_Usuario"
    WHERE 
      o."Titulo" IS NOT NULL AND o."Empresa" IS NOT NULL  -- Filtra solo ocupaciones formales
    ORDER BY 
      o."Fecha_Inicio" ASC; 
    `;
    const result = await this.pool.query(query);
    return result.rows;
  }
}

