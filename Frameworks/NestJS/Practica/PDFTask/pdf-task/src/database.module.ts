/* 
Este código crea un módulo llamado DatabaseModule que se encarga de establecer y gestionar la conexión a una base de datos PostgreSQL. El proveedor databaseProvider crea una instancia de un cliente de PostgreSQL y la exporta para que pueda ser utilizada en otros módulos de la aplicación.
*/

import { Module } from '@nestjs/common';
//import { Client } from 'pg'; //Importa la clase 'Client' desde el paquete 'pg', que es el cliente para conectarse a PostgreSQL.
import { Pool } from 'pg'; // Usa Pool en lugar de Client para manejar múltiples conexiones

const databaseProvider = { //Define un proveedor que se encargará de establecer la conexión a la base de datos.
  provide: 'DATABASE_CONNECTION', //Proporciona un identificador (token) que se usará para inyectar la conexión a la base de datos en otros lugares de la aplicación.
  useFactory: async () => { //Usa una fábrica asíncrona para crear y devolver la instancia de la conexión.
    const pool = new Pool({ //Crea una nueva instancia del cliente de PostgreSQL con los detalles de conexión.
      user: 'soporte',
      host: 'localhost', 
      database: 'db_prueba',
      password: 'soporte',
      port: 5432,
    });
    //await client.connect(); //Se conecta a la base de datos de forma asíncrona.
    return pool; //Retorna la instancia del cliente de PostgreSQL que estará conectada a la base de datos.
  },
};

@Module({
  providers: [databaseProvider], //Registra el 'databaseProvider' como proveedor en el módulo, lo que permitirá inyectarlo en otros lugares de la app.
  exports: [databaseProvider], //Exporta el proveedor, permitiendo que otros módulos de la aplicación puedan utilizar la conexión a la base de datos.
})
export class DatabaseModule {} //Define el módulo de la base de datos que encapsula la lógica de la conexión.


