import { Controller, Get, Post, Param, UploadedFile, UseInterceptors, Res, HttpException, HttpStatus } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname } from 'path';
import { FileService } from './file.service';
import { Response } from 'express';

@Controller('file')
export class FileController {
  constructor(private readonly fileService: FileService) {}

  //Método para generar UUID y guardar PDF en disco
  @Post('upload')
    @UseInterceptors(
      FileInterceptor('file', {
        storage: diskStorage({
          destination: './uploads',
          filename: (req, file, callback) => {
            const uuid = require('crypto').randomUUID(); //Genera un UUID único
            req.body.uuid = uuid; //Asocia el UUID al cuerpo de la solicitud
            const ext = extname(file.originalname); //Extrae la extensión del archivo
            const filename = `${uuid}${ext}`;
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
      const savedFile = await this.fileService.saveFileData({
        ...file,
        uuid: file.filename.split('.')[0], //Extrae el UUID del nombre del archivo
      });
  
      console.log('Archivo cargado correctamente:', savedFile);
  
      return {
        message: 'Archivo cargado correctamente.',
        uuid: savedFile.uuid,
        file: savedFile,
      };
    }
  
    @Get(':filename')
    async getFile(@Param('filename') filename: string, @Res() res: Response) {
      try {
        const filePath = this.fileService.getFilePath(filename);
  
        res.setHeader(
          'Content-Disposition',
          `attachment; filename=${filename}`,
        );
  
        res.sendFile(filePath); //Envía el archivo al cliente
      } catch (error) {
        console.error(`Error al intentar acceder al archivo ${filename}:`, error.message);
        res.status(404).json({ message: 'Archivo no encontrado.' });
      }
    }
  }