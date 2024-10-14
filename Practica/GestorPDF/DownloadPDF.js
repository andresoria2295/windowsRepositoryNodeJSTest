const { Client } = require('pg');
const fs = require('fs');

async function downloadPDF() {
  const client = new Client({
    user: 'soporte',
    host: 'localhost',
    database: 'db_prueba',
    password: 'soporte',
    port: 5432,
  });

  try {
    await client.connect();

    //Recuperar el PDF de la base de datos
    const res = await client.query('SELECT file_data FROM pdf_files WHERE id = $1', [1]); //Ajusta el ID según tu caso

    if (res.rows.length > 0) {
      const pdfBuffer = res.rows[0].file_data;

      //Guardar el archivo en el sistema
      fs.writeFileSync('download.pdf', pdfBuffer);
      console.log('Archivo PDF descargado exitosamente.');
    } else {
      console.log('No se encontró ningún archivo PDF con el ID especificado.');
    }
  } catch (err) {
    console.error('Error al descargar el PDF:', err);
  } finally {
    await client.end();
  }
}

downloadPDF();
