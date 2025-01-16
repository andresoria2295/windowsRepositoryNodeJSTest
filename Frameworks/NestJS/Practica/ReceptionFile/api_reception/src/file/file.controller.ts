import { Controller, Get, Post, Param, UploadedFile, UseInterceptors, Res, HttpException, HttpStatus } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname } from 'path';
import { FileService } from './file.service';
import { Response } from 'express';
import { join } from 'path';
import * as fs from 'fs';

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
          console.log('Archivo solicitado en API B:', filePath);

          res.sendFile(filePath, (err) => {
            if (err) {
              console.error('Error al enviar el archivo:', err.message);
              throw new HttpException(
                'Error al enviar el archivo.',
                HttpStatus.INTERNAL_SERVER_ERROR,
              );
            } else {
              console.log('Archivo enviado correctamente:', filePath);
            }
          });
        } catch (error) {
          console.error('Error en API B al obtener el archivo:', error.message);
          throw new HttpException(
            `Archivo ${filename} no existente.`,
            HttpStatus.NOT_FOUND,
          );
        }
      }


  }