import { Injectable, Inject } from '@nestjs/common';
import { Pool } from 'pg';

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

  //Método para creación de usuario.
  async createUser(newUserData: any): Promise<void> {
    const { nombre, apellido, fecha_nacimiento, email, contraseña, telefono, domicilio, ciudad, pais, ocupacion } = newUserData;
  
    if (!nombre || !apellido || !fecha_nacimiento || !email || !contraseña || !telefono || !domicilio || !ciudad || !pais) {
      throw new Error('Todos los campos obligatorios deben estar presentes');
    }
  
    const client = await this.pool.connect(); //Obtiene una nueva conexión del pool.
  
    try {
      await client.query('BEGIN'); //Inicia la transacción.
  
      //Inserción de usuario.
      const userResult = await client.query(
        `INSERT INTO "Usuario" ("Nombre", "Apellido", "Fecha_Nacimiento", "Email", "Contraseña", "Fecha_Creacion") 
         VALUES ($1, $2, $3, $4, $5, NOW()) RETURNING "Id_Usuario"`,
        [nombre, apellido, fecha_nacimiento, email, contraseña]
      );
  
      const usuarioId = userResult.rows[0].Id_Usuario;
  
      //Inserción de contacto.
      await client.query(
        `INSERT INTO "Contacto" ("Id_Usuario", "Telefono", "Domicilio", "Ciudad", "Pais") 
         VALUES ($1, $2, $3, $4, $5)`,
        [usuarioId, telefono, domicilio, ciudad, pais]
      );
  
      //Inserción de ocupación en caso de ser cargada.
      if (ocupacion) {
        const { titulo, empresa, fecha_inicio, documentacion } = ocupacion;
        await client.query(
          `INSERT INTO "Ocupacion" ("Titulo", "Empresa", "Fecha_Inicio", "Id_Usuario", "Documentacion") 
           VALUES ($1, $2, $3, $4, $5)`,
          [titulo, empresa || null, fecha_inicio || null, usuarioId, documentacion || null]
        );
      }
  
      await client.query('COMMIT'); //Finaliza la transacción.
    } catch (error) {
      await client.query('ROLLBACK'); //Deshace la transacción en caso de error.
      console.error('Error al crear el usuario:', error);
      throw new Error('Error al crear el usuario: ' + error.message);
    } finally {
      client.release();
    }
  }
}  