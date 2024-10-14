const fs = require('fs');
const { PDFDocument } = require('pdf-lib');
const sizeOf = require('image-size'); // Importa la biblioteca para obtener las dimensiones de la imagen

async function createPDFWithImage() {
  // Leer la imagen en formato Uint8Array
  const imagePath = 'E:/Andrés/Documentos/Trabajo/Programación/NodeJS/Practica/GestorPDF/image.jpg';
  const imageBytes = fs.readFileSync(imagePath);

  // Obtener las dimensiones de la imagen
  const dimensions = sizeOf(imagePath);
  const imgWidth = dimensions.width;
  const imgHeight = dimensions.height;

  // Crear un nuevo documento PDF
  const pdfDoc = await PDFDocument.create();

  // Ajustar el tamaño de la página para que se ajuste a la imagen (opcional)
  const pageWidth = Math.max(imgWidth, 600); // Ajusta este valor según sea necesario
  const pageHeight = Math.max(imgHeight, 400); // Ajusta este valor según sea necesario
  const page = pdfDoc.addPage([pageWidth, pageHeight]);

  // Incorporar la imagen en el documento PDF
  const jpgImage = await pdfDoc.embedJpg(imageBytes);

  // Calcular el nuevo tamaño manteniendo la relación de aspecto
  const aspectRatio = imgWidth / imgHeight;
  let newWidth = 2500; // Ajusta este valor según lo que desees
  let newHeight = newWidth / aspectRatio;

  // Asegúrate de que la imagen se dibuje dentro de la página
  const imageX = 100; // Posición X
  const imageY = pageHeight - newHeight - 50; // Posición Y (ajustada para que la imagen no se corte)

  // Dibujar la imagen en la página
  page.drawImage(jpgImage, {
    x: imageX,
    y: imageY,
    width: newWidth,
    height: newHeight,
  });

  // Serializar el PDF y guardarlo
  const pdfBytes = await pdfDoc.save();
  fs.writeFileSync('output-with-image.pdf', pdfBytes);

  console.log('PDF con imagen creado correctamente.');
}

createPDFWithImage();


