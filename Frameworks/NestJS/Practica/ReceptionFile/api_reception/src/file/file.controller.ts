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
          return callback(new Error('El sitema solo admite archivos de extensión .pdf'), false);
        }
        callback(null, true);
      },
    }),
  )
  async uploadFile(@UploadedFile() file: Express.Multer.File) {
    //Guarda datos adicionales del archivo si es necesario
    const savedFile = await this.fileService.saveFileData(file);
    return {
      message: 'Archivo cargado correctamente.',
      file: savedFile,
    };
  }

  @Get(':filename')
  async getFile(@Param('filename') filename: string, @Res() res: Response) {
    try {
      //Adquiere la ruta completa del archivo
      const filePath = this.fileService.getFilePath(filename);
      res.sendFile(filePath, { root: './' }); //Envía el archivo al cliente
    } catch (error) {
      res.status(404).json({ message: 'Archivo no encontrado.' });
    }
  }
}
