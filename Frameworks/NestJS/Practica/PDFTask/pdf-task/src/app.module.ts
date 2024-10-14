/* 
Este código actúa como el módulo raíz de la aplicación NestJS. En este módulo se importan PdfModule y DatabaseModule, lo que permite acceder a las funcionalidades relacionadas con archivos PDF y la conexión a la base de datos. También se registra el AppController para manejar las solicitudes HTTP de la aplicación y el AppService para contener la lógica de negocio. Así, AppModule sirve como un punto central para organizar y estructurar los componentes de la aplicación.
*/

import { Module } from '@nestjs/common'; //Importa el decorador 'Module' desde NestJS.
import { PdfModule } from './pdf/pdf.module'; //Importa el módulo `PdfModule`, que maneja las funcionalidades relacionadas con los archivos PDF.
import { DatabaseModule } from './database.module'; //Importa el módulo `DatabaseModule`, que gestiona la conexión a la base de datos PostgreSQL.
import { AppController } from './app.controller'; //Importa el controlador `AppController`, que maneja las solicitudes a nivel de aplicación.
import { AppService } from './app.service'; //Importa el servicio `AppService`, que contiene la lógica de negocio general de la aplicación.

@Module({
  imports: [PdfModule, DatabaseModule], //Importa el `PdfModule` y el `DatabaseModule`, permitiendo que estén disponibles dentro del módulo `AppModule`.
  controllers: [AppController], //Registra el controlador `AppController`, que define las rutas y endpoints de la aplicación.
  providers: [AppService], //Registra el servicio `AppService`, que proporciona la lógica de negocio general para la aplicación.
})
export class AppModule {} //Define y exporta el módulo `AppModule`, que es el módulo raíz de la aplicación y agrupa otros módulos, controladores y servicios.

