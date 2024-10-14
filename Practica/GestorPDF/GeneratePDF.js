const fs = require('fs');
const { PDFDocument, rgb } = require('pdf-lib');

async function createPDF() {
  //Crear un nuevo documento PDF
  const pdfDoc = await PDFDocument.create();

  //Agregar una página al documento
  const page = pdfDoc.addPage([600, 400]);

  //Dibujar el texto en la página
  const text = "¡Hola Mundo!";

  page.drawText(text, {
    x: 50,
    y: 350,
    size: 30,
    color: rgb(0, 0.53, 0.71),
  });

  //Serializar el PDF y guardarlo como archivo
  const pdfBytes = await pdfDoc.save();

  //Guardar el archivo en el sistema de archivos
  fs.writeFileSync('output.pdf', pdfBytes);
  console.log('PDF creado correctamente.');
}

createPDF();
