import { Controller, Get, Post, Param, UploadedFile, UseInterceptors, Res } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname } from 'path';
import { FileService } from './file.service';
import { Response } from 'express';

@Controller('file')
export class FileController {
  constructor(private readonly fileService: FileService) {}

  @Post('upload')
  @UseInterceptors(
    FileInterceptor('file', {
      storage: diskStorage({
        destination: './uploads', //Carpeta donde se guardarán los archivos
        filename: (req, file, callback) => {
          const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
          const ext = extname(file.originalname); //Extrae la extensión del archivo
          const filename = `${file.fieldname}-${uniqueSuffix}${ext}`;
          callback(null, filename);
        },
      }),
      fileFilter: (req, file, callback) => {
        //Permite solo archivos PDF
        if (file.mimetype !== 'application/pdf') {
          return callback(new Error('El sistema solo admite archivos de extensión .pdf'), false);
        }
        callback(null, true);
      },
  }),
  )
  async uploadFile(@UploadedFile() file: Express.Multer.File) {
    //console.log('Solicitud recibida:', file);
    const uuid = this.generateUUID(); //Genera un UUID único

    //Crea un nuevo objeto que incluye el uuid
    const fileWithUuid = {
      ...file,
      uuid,
    };

    //Guarda los datos del archivo con el UUID
    const savedFile = await this.fileService.saveFileData(fileWithUuid);

    console.log('Solicitud recibida en API B:');
    console.log('Archivo:', file);
    console.log('UUID generado:', uuid);
    console.log('Datos guardados:', savedFile);
    
    console.log('Respuesta generada para API A: ', {
      message: 'Archivo cargado correctamente.',
      uuid: uuid,
      file: savedFile,
    });
    
    return {
      message: 'Archivo cargado correctamente.',
      uuid: uuid, //Devuelve el UUID generado
      file: savedFile,
    };
  }

private generateUUID(): string {
  return require('crypto').randomUUID(); // Genera un UUID único
}


  @Get(':filename')
  async getFile(@Param('filename') filename: string, @Res() res: Response) {
    try {
      //Adquiere la ruta completa del archivo
      const filePath = this.fileService.getFilePath(filename);

      //Configura el encabezado para forzar la descarga
      res.setHeader(
        'Content-Disposition',
        `attachment; filename=${filename}`,
      );

      res.sendFile(filePath); //Envía el archivo al cliente
    } catch (error) {
      res.status(404).json({ message: 'Archivo no encontrado.' });
    }
  }
}
