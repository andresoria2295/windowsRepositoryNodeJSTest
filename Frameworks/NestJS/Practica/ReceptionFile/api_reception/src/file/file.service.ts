import { Injectable } from '@nestjs/common';
import { diskStorage } from 'multer';
import { join, extname } from 'path';
import * as fs from 'fs';

@Injectable()
export class FileService {
  //Método para guardar información adicional del archivo
  public async saveFileData(file: Express.Multer.File & { uuid: string }): Promise<any> {
    const fileData = {
      uuid: file.uuid,
      originalName: file.originalname,
      filename: file.filename,
      path: file.path,
      size: file.size,
    };

    console.log('Guardando datos del archivo:', fileData);

    return fileData; //Devuelve los datos guardados
  }

  //Método para obtener la ruta completa de un archivo
  public getFilePath(filename: string): string {
    const filePathWithoutExt = join(process.cwd(), 'uploads', filename); //Sin extensión
    const filePathWithExt = `${filePathWithoutExt}.pdf`; //Con extensión
  
    if (fs.existsSync(filePathWithoutExt)) {
      return filePathWithoutExt; //Devuelve la ruta sin extensión si existe
    } else if (fs.existsSync(filePathWithExt)) {
      return filePathWithExt; //Devuelve la ruta con extensión si existe
    }
  
    console.error(`Archivo no encontrado. Rutas buscadas: 
    - ${filePathWithoutExt}
    - ${filePathWithExt}`);
    throw new Error(`File ${filename} no existente.`);
  }
}