/* 
Este código define un servicio básico en NestJS llamado AppService que incluye un método getHello(), el cual  retorna el texto "Hello World!". La clase está decorada con @Injectable(), lo que permite que este servicio sea inyectado en otras partes de la aplicación, como por ejemplo, en un controlador.
*/
import { Injectable } from '@nestjs/common'; //Importa el decorador 'Injectable' desde el paquete '@nestjs/common', lo que indica que esta clase puede ser inyectada como un servicio.

@Injectable() //Marca la clase `AppService` como inyectable, permitiendo que sea utilizada por otros componentes, como controladores, a través de la inyección de dependencias.
export class AppService { //Define una clase de servicio `AppService`.
  
  getHello(): string { 
    return 'Hello World!'; 
  }
}
