/* 
    Este código define un servicio PdfService que permite subir y descargar archivos PDF desde una base de datos PostgreSQL. Se inyecta un cliente de PostgreSQL mediante el token 'DATABASE_CONNECTION'
*/

import { Injectable, Inject } from '@nestjs/common'; //Importa 'Injectable' como servicio inyectable y 'Inject' para inyectar dependencias.
import { Client } from 'pg'; //Importa 'Client' desde el paquete 'pg', que es el cliente para conectarse a PostgreSQL.
import * as fs from 'fs'; //Importa el módulo 'fs' de Node.js para trabajar con el sistema de archivos, necesario para guardar el PDF en el servidor.

@Injectable() //Marca la clase `PdfService` como inyectable, lo que permite usarla en otros lugares de la aplicación, como en controladores.
export class PdfService {
  private client: Client; //Declara una propiedad privada 'client' que será del tipo 'Client' de PostgreSQL.

  constructor(@Inject('DATABASE_CONNECTION') client: Client) { // El constructor recibe la conexión a la base de datos PostgreSQL que fue inyectada mediante el token 'DATABASE_CONNECTION'.
    this.client = client; //Asigna el cliente PostgreSQL inyectado a la propiedad privada 'client' del servicio.
  }

  //Función para descargar archivo PDF de la bd.
  async downloadPDF(id: number): Promise<string> { //Declara un método asíncrono `downloadPDF` que recibe un número 'id' y retorna una promesa que resuelve a una cadena de texto (la ruta del archivo descargado).
    try {
      //Realiza una consulta a la base de datos para obtener el archivo PDF por su ID.
      const res = await this.client.query('SELECT file_data FROM pdf_files WHERE id = $1', [id]); 
      if (res.rows.length > 0) { //Si la consulta devuelve al menos un registro (PDF encontrado):
        const pdfBuffer = res.rows[0].file_data; //Obtiene los datos binarios del archivo PDF desde el resultado de la consulta.
        const filePath = `download-${id}.pdf`; //Genera un nombre para el archivo descargado, basado en el ID.

        //Guarda el archivo PDF en el sistema de archivos local usando el nombre generado.
        fs.writeFileSync(filePath, pdfBuffer); 
        return filePath; //Retorna la ruta del archivo descargado.
      } else {
        throw new Error('Archivo PDF no encontrado.'); //Si no se encuentra un archivo con el ID especificado, lanza un error.
      }
    } catch (err) {
      throw new Error(`Error al descargar el PDF: ${err.message}`); //Captura cualquier error durante el proceso y lanza un nuevo error con el mensaje correspondiente.
    }
  }

  //Función para subir  archivo PDF a la bd.
  async uploadPDF(pdfBuffer: Buffer, originalFileName: string): Promise<void> { //Declara un método asíncrono `uploadPDF` que recibe un buffer de datos 'pdfBuffer' y el nombre original del archivo 'originalFileName', y no retorna ningún valor (void).
    try {
      //Verifica que el nombre del archivo no esté vacío o sea nulo.
      if (!originalFileName) {
        throw new Error('El nombre del archivo no puede estar vacío'); //Lanza un error si el nombre del archivo es inválido.
      }

      //Realiza una consulta para insertar el archivo PDF (sus datos binarios y nombre) en la base de datos.
      await this.client.query(
        'INSERT INTO pdf_files (file_data, filename) VALUES ($1, $2)', 
        [pdfBuffer, originalFileName] //Se pasan los valores del archivo y su nombre como parámetros de la consulta.
      );
    } catch (err) {
      throw new Error(`Error al subir el PDF: ${err.message}`); //Captura cualquier error durante el proceso y lanza un nuevo error con el mensaje correspondiente.
    }
  }
}



