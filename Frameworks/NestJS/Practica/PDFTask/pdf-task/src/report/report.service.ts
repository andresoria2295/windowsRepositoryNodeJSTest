import { Injectable, Inject } from '@nestjs/common';
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
  
  async createUser(newUserData: any, file: Express.Multer.File): Promise<void> {
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
      await client.query('BEGIN'); // Iniciar transacción

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
          //Validar el tipo de archivo (opcional)
          if (file.mimetype !== 'application/pdf') {
            throw new Error('El archivo debe ser un PDF');
          }

          try {
            //Directorio donde se guardará el archivo
            const uploadDir = path.join(__dirname, '..', '..', 'uploads');
            if (!fs.existsSync(uploadDir)) {
              fs.mkdirSync(uploadDir, { recursive: true }); // Crear directorio si no existe
            }

            //Guarda archivo en el sistema de archivos
            const filePath = path.join(uploadDir, file.originalname);
            fs.writeFileSync(filePath, file.buffer);

            //Leer el archivo en formato buffer para la base de datos
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
    const { nombre, apellido, fecha_nacimiento, email, telefono, domicilio, ciudad, pais, ocupacion } = updatedData;

    const client = await this.pool.connect();

    try {
      await client.query('BEGIN');

      //Actualiza la tabla Usuario, permitiendo `NULL`.
      await client.query(
        `UPDATE "Usuario"
         SET "Nombre" = $1, 
             "Apellido" = $2, 
             "Fecha_Nacimiento" = $3, 
             "Email" = $4
         WHERE "Id_Usuario" = $5`,
        [nombre, apellido, fecha_nacimiento, email, userId]
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

  //Método para actualización parcial (PATCH).
  async updatePartialUser(userId: number, updatedData: any): Promise<void> {
    const client = await this.pool.connect();
  
    try {
      await client.query('BEGIN');
  
      const occupationFields: string[] = [];
      const occupationValues: any[] = [];
      let index = 1;
  
      // Solo añadimos los campos que vienen en updatedData
      if (updatedData.titulo !== undefined) {
        occupationFields.push(`"Titulo" = $${index}`);
        occupationValues.push(updatedData.titulo);
        index++;
      }
      if (updatedData.empresa !== undefined) {
        occupationFields.push(`"Empresa" = $${index}`);
        occupationValues.push(updatedData.empresa);
        index++;
      }
      if (updatedData.fecha_inicio !== undefined) {
        occupationFields.push(`"Fecha_Inicio" = $${index}`);
        occupationValues.push(updatedData.fecha_inicio);
        index++;
      }
      if (updatedData.documentacion !== undefined) {
        occupationFields.push(`"Documentacion" = $${index}`);
        occupationValues.push(updatedData.documentacion);
        index++;
      }
  
      //Se comprueba si ya existe un registro en la tabla "Ocupacion" para este usuario.
      const occupationCheckQuery = `SELECT * FROM "Ocupacion" WHERE "Id_Usuario" = $1`;
      const occupationCheckResult = await client.query(occupationCheckQuery, [userId]);
  
      if (occupationCheckResult.rows.length > 0) {
        //Si existe un registro, se actualiza solo los campos proporcionados.
        if (occupationFields.length > 0) {
          const occupationUpdateQuery = `UPDATE "Ocupacion" SET ${occupationFields.join(', ')} WHERE "Id_Usuario" = $${index}`;
          occupationValues.push(userId); //Se agrega el ID del usuario para la cláusula WHERE
          await client.query(occupationUpdateQuery, occupationValues);
        }
      } else {
        //Si no existe un registro, se crea uno nuevo.
        const occupationInsertFields = occupationFields.map(f => f.split(' ')[0].replace('=', '').trim()).join(', ');
        const occupationInsertValues = occupationFields.map((_, idx) => `$${idx + 1}`).join(', ');
        const occupationInsertQuery = `
          INSERT INTO "Ocupacion" ("Id_Usuario", ${occupationInsertFields})
          VALUES ($${index}, ${occupationInsertValues})
        `;
        occupationValues.push(userId); 
        await client.query(occupationInsertQuery, occupationValues);
      }
  
      await client.query('COMMIT');
    } catch (error) {
      await client.query('ROLLBACK');
      console.error('Error al actualizar ocupacion:', error);
      throw new Error('Error al actualizar ocupacion: ' + error.message);
    } finally {
      client.release();
    }
  }

  //Método para eliminar usuario.
  async deleteUser(userId: number): Promise<void> {
    const client = await this.pool.connect();
    
    try {
      await client.query('BEGIN');
  
      //Primero eliminar la ocupación relacionada si existe
      await client.query(
        `DELETE FROM "Ocupacion" WHERE "Id_Usuario" = $1`,
        [userId]
      );
  
      //Luego eliminar el contacto relacionado.
      await client.query(
        `DELETE FROM "Contacto" WHERE "Id_Usuario" = $1`,
        [userId]
      );
  
      //Finalmente eliminar el usuario.
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
