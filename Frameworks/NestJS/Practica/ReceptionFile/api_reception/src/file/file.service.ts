import { Injectable } from '@nestjs/common';
import { diskStorage } from 'multer';
import { join, extname } from 'path';
import * as fs from 'fs';

@Injectable()
export class FileService {
  //Configuración de Multer para almacenamiento en disco
  public storageConfig() {
    return diskStorage({
      destination: './uploads', // Carpeta donde se guardan los archivos
      filename: (req, file, callback) => {
        //Generación de un nombre único para cada archivo
        const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
        const fileExt = extname(file.originalname); //Obtiene la extensión del archivo
        const newFilename = `file-${uniqueSuffix}${fileExt}`;
        callback(null, newFilename); //Asigna el nombre al archivo
      },
    });
  }

  //Método para guardar información adicional del archivo (incluyendo el UUID)
  public saveFileData(file: Express.Multer.File & { uuid: string }): any {
    return {
      uuid: file.uuid, //Agrega el UUID al objeto devuelto
      originalName: file.originalname,
      filename: file.filename,
      path: file.path,
      size: file.size,
    };
  }

  //Método para obtener la ruta completa de un archivo
  public getFilePath(filename: string): string {
    const filePath = join(process.cwd(), 'uploads', filename);

    //Valida si el archivo existe antes de devolver la ruta
    if (!fs.existsSync(filePath)) {
      throw new Error(`File ${filename} no existente.`);
    }

    return filePath;
  }
}