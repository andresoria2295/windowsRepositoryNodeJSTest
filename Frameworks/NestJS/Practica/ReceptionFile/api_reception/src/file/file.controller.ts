import {Controller, Post, UploadedFile, UseInterceptors, Body, Get, Param, Res, HttpException, HttpStatus, Req} from '@nestjs/common'; 
import { FileInterceptor } from '@nestjs/platform-express'; 
import { diskStorage } from 'multer';
import { extname } from 'path'; 
import { FileService } from './file.service'; 
import { Response } from 'express'; 
import * as fs from 'fs'; 

@Controller('file') 
export class FileController {
  constructor(private readonly fileService: FileService) {}

  //Subida de archivos
  @Post('upload') 
  @UseInterceptors(
    FileInterceptor('file', {
      //Interceptor para manejar la subida de archivos
      storage: diskStorage({
        //Configura el almacenamiento del archivo
        destination: (req, file, callback) => {
          console.log('Body completo recibido:', req.body);
          console.log('nombre_usuario:', req.body.nombre_usuario); 
          console.log('apellido_usuario:', req.body.apellido_usuario); 

          const nombreUsuario = req.body.nombre_usuario || 'sin_nombre'; 
          const apellidoUsuario = req.body.apellido_usuario || 'sin_apellido';

          //Genera el nombre de la carpeta basado en el nombre y apellido del usuario
          const folderName = `${nombreUsuario}_${apellidoUsuario}`
            .toLowerCase() //Convierte a minúsculas
            .normalize('NFD') //Normaliza caracteres especiales
            .replace(/[\u0300-\u036f]/g, '') //Elimina diacríticos
            .replace(/[^a-z0-9_]/g, '_'); //Reemplaza caracteres no alfanuméricos con _

          console.log('Nombre de carpeta generado:', folderName); 

          const uploadPath = `./uploads/${folderName}`;

          if (!fs.existsSync(uploadPath)) {
            fs.mkdirSync(uploadPath, { recursive: true });
          }

          req['userFolder'] = folderName; //Guarda el nombre de la carpeta en req
          callback(null, uploadPath); //Retorna la ruta de destino
        },
        filename: (req, file, callback) => {
          //Define el nombre del archivo
          const uuid = require('crypto').randomUUID(); //Genera un UUID único
          const ext = extname(file.originalname); //Obtiene la extensión del archivo
          const filename = `${uuid}${ext}`; //Crea el nombre del archivo con UUID y extensión

          req['fileUuid'] = uuid; 
          callback(null, filename); //Retorna el nombre del archivo
        },
      }),
      fileFilter: (req, file, callback) => {
        //Filtra los archivos permitidos
        if (file.mimetype !== 'application/pdf') {
          //Solo permite archivos PDF
          return callback(
            new Error('El sistema solo admite archivos de extensión .pdf'),
            false,
          );
        }
        callback(null, true);
      },
    }),
  )
  async uploadFile(
    @UploadedFile() file: Express.Multer.File, //Archivo subido
    @Body() body: { nombre_usuario: string; apellido_usuario: string }, //Datos del cuerpo de la solicitud
    @Req() req: Request, 
  ) {
    const userFolder = req['userFolder']; //Obtiene la carpeta del usuario desde req
    const uuid = req['fileUuid']; //Obtiene el UUID del archivo desde req

    console.log('Guardando datos del archivo:', {
      //Log de los datos del archivo
      uuid,
      originalname: file.originalname,
      filename: file.filename,
      path: file.path,
      size: file.size,
      userFolder,
    });

    const fileData = {
      //Crea un objeto con los datos del archivo
      ...file, //Propiedades del archivo
      uuid, //UUID generado
      userFolder, //Carpeta del usuario
    };

    const savedFile = await this.fileService.saveFileData(fileData); //Guarda los datos del archivo

    return {
      message: 'Archivo cargado correctamente.',
      uuid: savedFile.uuid,
      file: savedFile,
    };
  }

  //Obtiene el archivo
  @Get(':filename') 
  async getFile(@Param('filename') filename: string, @Res() res: Response) {
    try {
      const filePath = await this.fileService.getFilePath(filename); //Obtiene la ruta
      console.log('Archivo solicitado en API B:', filePath); 

      res.sendFile(filePath, (err) => {
        //Envía el archivo como respuesta
        if (err) {
          console.error('Error al enviar el archivo:', err.message); 
          throw new HttpException(
            'Error al enviar el archivo.',
            HttpStatus.INTERNAL_SERVER_ERROR,
          ); // Lanza una excepción
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