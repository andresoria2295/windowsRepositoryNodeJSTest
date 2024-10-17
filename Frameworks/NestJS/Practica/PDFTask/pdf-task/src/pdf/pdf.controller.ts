/* 
Postman: http://localhost:3000/pdf/upload
*/

import { Controller, Get, Param, Res, Post, UseInterceptors, UploadedFile } from '@nestjs/common'; 
import { PdfService } from './pdf.service'; //Importa el servicio `PdfService`, que contiene la lógica para manejar archivos PDF.
import { Response } from 'express'; //Importa la clase `Response` de Express para manejar las respuestas HTTP.
import { FileInterceptor } from '@nestjs/platform-express'; //Importa el interceptor `FileInterceptor`, que permite manejar la subida de archivos en NestJS.
import * as path from 'path'; //Importa el módulo `path` de Node.js para manejar rutas de archivos.

@Controller('pdf') //Define el controlador con la ruta base '/pdf'.
export class PdfController {
  constructor(private readonly pdfService: PdfService) {} //Inyecta el servicio `PdfService` en el controlador.

  //Descargar archivo PDF.
  @Get('download/:id') //Define un endpoint HTTP GET en '/pdf/download/:id' que permite descargar un archivo PDF por su ID.
  async downloadPDF(@Param('id') id: string, @Res() res: Response) { //Método asíncrono que recibe el ID como parámetro y la respuesta HTTP.
    try {
      const filePath = await this.pdfService.downloadPDF(parseInt(id)); //Llama al método `downloadPDF` del servicio y espera la ruta del archivo.

      //Verificar si el archivo existe y enviarlo como respuesta
      if (filePath) {
        res.download(path.resolve(filePath)); //Si la ruta del archivo es válida, envía el archivo como respuesta.
      } else {
        res.status(404).send('Archivo no encontrado.'); //Si no se encuentra el archivo, devuelve un error 404.
      }
    } catch (error) {
      res.status(404).send(error.message); //Si ocurre un error, devuelve un error 404 con el mensaje del error.
    }
  }

  //Subir archivo PDF.
  @Post('upload') //Define un endpoint HTTP POST en '/pdf/upload' que permite subir un archivo PDF.
  @UseInterceptors(FileInterceptor('file')) //Usa el interceptor `FileInterceptor` para manejar la subida del archivo, donde 'file' es el nombre del campo en el formulario.
  async uploadPDF(@UploadedFile() file: Express.Multer.File, @Res() res: Response) { //Método asíncrono que recibe el archivo subido y la respuesta HTTP.
    try {
      if (!file) {
        return res.status(400).send('No se recibió ningún archivo.'); //Verifica si se ha recibido un archivo, si no, devuelve un error 400.
      }

      const pdfBuffer = file.buffer; //Obtiene el buffer de datos del archivo subido.
      const originalFileName = file.originalname; //Obtiene el nombre original del archivo subido.

      //Verificar si el nombre del archivo es válido
      if (!originalFileName) {
        throw new Error('El archivo no tiene un nombre válido'); //Lanza un error si el nombre del archivo no es válido.
      }

      //Subir el PDF usando el servicio.
      await this.pdfService.uploadPDF(pdfBuffer, originalFileName); //Llama al método `uploadPDF` del servicio para subir el archivo.
      res.status(201).send('Archivo PDF subido exitosamente.'); //Devuelve una respuesta exitosa 201 si la subida fue correcta.
    } catch (error) {
      console.error('Error al subir el archivo:', error.message); //Imprime el error en la consola para depuración.
      res.status(500).send('Error al subir el archivo PDF.'); //Devuelve un error 500 si ocurre algún problema al subir el archivo.
    }
  }
}
