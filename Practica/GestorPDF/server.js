const express = require('express');  //Importamos el módulo Express para crear el servidor web.
const fs = require('fs');            //Importamos el módulo fs (file system) para interactuar con el sistema de archivos.

const app = express();  //Creamos una instancia de Express para configurar las rutas y manejar las peticiones HTTP.

app.get('/pdf', (req, res) => {  //Definimos una ruta GET en '/pdf'. Cada vez que un usuario visite esta ruta, se ejecutará la función.
  const filePath = 'E:/Andrés/Documentos/Trabajo/Programación/NodeJS/Practica/GestorPDF/factura.pdf'; // Aquí especificamos la ruta del archivo PDF que queremos enviar al cliente.
                                            // Debes cambiar esta ruta por la ubicación real de tu archivo.

  //Verificamos si el archivo existe en la ubicación especificada.
  fs.stat(filePath, (err, stat) => {
    if (err) {  //Si hay un error, significa que el archivo no fue encontrado.
      res.status(404).send('Archivo no encontrado');  //Respondemos con un error 404 y un mensaje.
      return; 
    }

    //Si el archivo existe, configuramos los encabezados HTTP para indicar que se está enviando un archivo PDF.
    res.setHeader('Content-Type', 'application/pdf'); // Establecemos el tipo de contenido como 'application/pdf'.
    
    //Creamos un flujo de lectura (readStream) para leer el archivo PDF.
    const readStream = fs.createReadStream(filePath);
    
    //Usamos pipe() para enviar el contenido del archivo PDF al cliente a través de la respuesta HTTP.
    readStream.pipe(res);
  });
});

app.listen(3000, () => {  //Colocamos el servidor a escuchar en el puerto 3000.
  console.log('Servidor escuchando en http://localhost:3000');  // Imprimimos un mensaje en la consola cuando el servidor esté activo.
});