import { Injectable, Inject } from '@nestjs/common';
import { Pool } from 'pg';
import * as fs from 'fs';
import * as path from 'path';

@Injectable()
export class UserService {
  constructor(@Inject('DATABASE_CONNECTION') private readonly pool: Pool) {}

//Método para lectura de datos completos.
async getUser(): Promise<any[]> {
    const query = `
      SELECT 
        u."Nombre",
        u."Apellido",
        u."Fecha_Nacimiento",
        u."Email",
        c."Telefono",
        c."Domicilio",
        c."Ciudad" AS "Ciudad_Contacto",
        c."Pais" AS "Pais_Contacto",
        f."Nombre" AS "Titulo_Formacion",
        f."Descripcion",
        f."Nivel",
        f."Institucion",
        f."Duracion",
        f."Fecha_Obtencion",
        f."Activo" AS "Titulo_Activo",
        e."Nombre" AS "Nombre_Empresa",
        e."Razon_Social",
        e."Direccion" AS "Direccion_Empresa",
        e."Ciudad" AS "Ciudad_Empresa",
        e."Pais" AS "Pais_Empresa",
        e."Telefono" AS "Telefono_Empresa",
        e."Email" AS "Email_Empresa",
        e."Sitio_Web",
        e."Industria",
        e."Estado" AS "Empresa_Activa",
        em."Fecha_Inicio",
        em."Fecha_Fin",
        em."Posicion",
        em."Activo" AS "Empleo_Activo"
      FROM 
        "Usuario" u
      LEFT JOIN 
        "Contacto" c ON u."Id_Usuario" = c."Id_Usuario"
      LEFT JOIN 
        "Empleo" em ON u."Id_Usuario" = em."Id_Usuario"
      LEFT JOIN 
        "Empresa" e ON em."Id_Empresa" = e."Id_Empresa"
      LEFT JOIN 
        "Formacion" f ON em."Id_Formacion" = f."Id_Formacion"
      ORDER BY 
        u."Id_Usuario";
    `;
    const result = await this.pool.query(query);
    return result.rows;
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

// Método para leer los datos de un usuario específico
async getSpecificUser(userId: number): Promise<any> {
    const client = await this.pool.connect();
    try {
      // Inicia la transacción
      await client.query('BEGIN');
  
      // Consulta los datos básicos del usuario
      const usuarioResult = await client.query(
        `SELECT * FROM "Usuario" WHERE "Id_Usuario" = $1`,
        [userId]
      );
  
      if (usuarioResult.rows.length === 0) {
        throw new Error('Usuario no encontrado');
      }
  
      const usuario = usuarioResult.rows[0];
  
      // Consulta los datos de contacto
      const contactoResult = await client.query(
        `SELECT * FROM "Contacto" WHERE "Id_Usuario" = $1`,
        [userId]
      );
      const contacto = contactoResult.rows[0] || null;
  
      // Consulta la formación asociada al usuario a través de empleo
      const formacionResult = await client.query(
        `SELECT f.* 
         FROM "Empleo" e 
         JOIN "Formacion" f ON e."Id_Formacion" = f."Id_Formacion"
         WHERE e."Id_Usuario" = $1`,
        [userId]
      );
      const formacion = formacionResult.rows[0] || null;
      console.log('Resultado de la consulta Formacion:', formacionResult.rows);
  
      // Consulta la empresa asociada al usuario a través de empleo
      const empresaResult = await client.query(
        `SELECT emp.* 
         FROM "Empleo" e 
         JOIN "Empresa" emp ON e."Id_Empresa" = emp."Id_Empresa"
         WHERE e."Id_Usuario" = $1`,
        [userId]
      );
      const empresa = empresaResult.rows[0] || null;
  
      // Consulta el empleo del usuario
      const empleoResult = await client.query(
        `SELECT * FROM "Empleo" WHERE "Id_Usuario" = $1`,
        [userId]
      );
      const empleo = empleoResult.rows[0] || null;
  
      // Combinamos todos los datos en un objeto final
      const usuarioCompleto = {
        usuario,
        contacto,
        formacion,
        empresa,
        empleo,
      };
  
      // Confirma la transacción
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
  
//Método para eliminar usuario y sus datos relacionados.
async deleteUser(userId: number): Promise<void> {
    const client = await this.pool.connect();
    
    try {
      await client.query('BEGIN');
      
      // Elimina los empleos relacionados, asegurando eliminar también la empresa y la formación si no se usan en otro lugar.
      await client.query(
        `DELETE FROM "Empleo" WHERE "Id_Usuario" = $1`,
        [userId]
      );
  
      // Elimina los registros en la tabla Empresa relacionados con el usuario si la empresa no está asociada a otro usuario.
      await client.query(
        `DELETE FROM "Empresa" 
         WHERE "Id_Empresa" IN (SELECT "Id_Empresa" FROM "Empleo" WHERE "Id_Usuario" = $1)`,
        [userId]
      );
  
      // Elimina las formaciones relacionadas si no están asociadas a otros usuarios o registros.
      await client.query(
        `DELETE FROM "Formacion" 
         WHERE "Id_Formacion" IN (SELECT "Id_Formacion" FROM "Empleo" WHERE "Id_Usuario" = $1)`,
        [userId]
      );
  
      // Luego elimina el contacto relacionado.
      await client.query(
        `DELETE FROM "Contacto" WHERE "Id_Usuario" = $1`,
        [userId]
      );
  
      // Finalmente elimina el usuario.
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
