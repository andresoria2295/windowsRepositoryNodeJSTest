import { Injectable, Inject, BadRequestException } from '@nestjs/common';
import { Pool } from 'pg';
import * as fs from 'fs';
import * as path from 'path';

@Injectable()
export class ReportService {
  constructor(@Inject('DATABASE_CONNECTION') private readonly pool: Pool) {}

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

