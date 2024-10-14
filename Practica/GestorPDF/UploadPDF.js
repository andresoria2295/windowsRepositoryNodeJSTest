const { Client } = require('pg');  //Importamos el módulo 'pg' para interactuar con PostgreSQL.
const fs = require('fs');          //Importamos 'fs' para leer el archivo PDF del sistema de archivos.
const path = require('path');      //Importamos 'path' para manejar rutas de archivos de manera robusta.

//Configuración de la conexión a la base de datos PostgreSQL
const client = new Client({
  user: 'soporte',
  host: 'localhost',
  database: 'db_prueba',
  password: 'soporte',
  port: 5432,
});

async function uploadPDFtoDatabase(pdfPath) {
  try {
    //Conectar con la base de datos PostgreSQL
    await client.connect();

    //Leer el archivo PDF de la ruta especificada
    const pdfData = fs.readFileSync(pdfPath);

    //Extraer el nombre del archivo PDF
    const filename = path.basename(pdfPath);

    //Ejecutar la consulta para insertar el archivo en la base de datos
    const query = 'INSERT INTO pdf_files (filename, file_data) VALUES ($1, $2)';
    const values = [filename, pdfData];
    await client.query(query, values);

    console.log(`El archivo ${filename} se ha cargado correctamente en la base de datos.`);
  } catch (err) {
    console.error('Error al cargar el archivo PDF en la base de datos:', err);
  } finally {
    //Cerrar la conexión a la base de datos
    await client.end();
  }
}

//Especificar la ruta del archivo PDF que deseas cargar
const pdfPath = 'E:/Andrés/Documentos/Trabajo/Programación/NodeJS/Practica/GestorPDF/factura.pdf'; 
uploadPDFtoDatabase(pdfPath);

//Consulta: SELECT id, filename, octet_length(file_data) AS file_size FROM pdf_files;

