/* 
Agrupa las funcionalidades relacionadas con la gestión de archivos PDF en la aplicación. El módulo importa el DatabaseModule para tener acceso a la conexión con la base de datos. Además, registra el controlador PdfController para manejar las solicitudes HTTP relacionadas con PDF y el servicio PdfService para realizar la lógica de negocio detrás de esas solicitudes, como subir y descargar archivos PDF.
*/

import { Module } from '@nestjs/common'; //Importa el decorador 'Module' desde NestJS, necesario para definir un módulo.
import { PdfController } from './pdf.controller'; //Importa el controlador `PdfController`, que manejará las solicitudes relacionadas con los archivos PDF.
import { PdfService } from './pdf.service'; //Importa el servicio `PdfService`, que contiene la lógica para manejar archivos PDF (subida y descarga).
import { DatabaseModule } from 'src/database.module'; //Importa el módulo `DatabaseModule`, que gestiona la conexión a la base de datos PostgreSQL.

@Module({
  imports: [DatabaseModule], //Importa el módulo de la base de datos para que esté disponible dentro del módulo `PdfModule`.
  controllers: [PdfController], //Registra el controlador `PdfController`, que define las rutas y endpoints para las operaciones relacionadas con los PDF.
  providers: [PdfService], //Registra el servicio `PdfService`, que maneja la lógica de negocio para los archivos PDF, como subir y descargar.
})
export class PdfModule {} //Define y exporta el módulo `PdfModule`, que agrupa el controlador y el servicio relacionados con la gestión de archivos PDF.

