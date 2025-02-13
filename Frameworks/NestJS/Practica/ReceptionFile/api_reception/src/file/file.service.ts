import { Injectable, NotFoundException } from '@nestjs/common'; 
import { join, extname } from 'path'; 
import * as fs from 'fs'; 
import { promisify } from 'util'; 

//Convierte funciones de fs (basadas en callbacks) a promesas para usar async/await
const readdirAsync = promisify(fs.readdir); //Para leer directorios
const statAsync = promisify(fs.stat); //Para obtener información de archivos/directorios

@Injectable() 
export class FileService {

  //Guarda los metadatos de un archivo subido
  public async saveFileData(
    file: Express.Multer.File & { uuid: string; userFolder: string }, //Recibe el archivo y datos adicionales
  ): Promise<any> {
    const fileData = {
      uuid: file.uuid, //UUID único del archivo
      originalName: file.originalname, //Nombre original del archivo
      filename: file.filename, //Nombre del archivo guardado
      path: file.path, //Ruta completa del archivo en el sistema
      size: file.size, //Tamaño del archivo en bytes
      userFolder: file.userFolder, //Carpeta del usuario donde se guardó
    };

    console.log('Guardando datos del archivo:', fileData); 
    return fileData; //Devuelve los metadatos del archivo
  }

  //Busca un archivo por su nombre en la carpeta de uploads y subcarpetas
  public async getFilePath(filename: string): Promise<string> {
    const uploadsPath = join(process.cwd(), 'uploads'); 

    //Función para buscar el archivo en subcarpetas
    const findFile = async (dir: string): Promise<string | null> => {
      const files = await readdirAsync(dir); //Lee los archivos en el directorio actual

      for (const file of files) { 
        const currentPath = join(dir, file); //Ruta completa del archivo/directorio
        const stats = await statAsync(currentPath); //Obtiene información del archivo/directorio

        if (stats.isDirectory()) { 
          const result = await findFile(currentPath);
          if (result) return result; //Si encuentra el archivo, retorna su ruta
        } else if (file.includes(filename)) { //Si es el archivo buscado
          return currentPath; //Retorna la ruta del archivo
        }
      }

      return null; 
    };

    const filePath = await findFile(uploadsPath); //Inicia la búsqueda desde la carpeta uploads
    if (filePath) return filePath; 

    console.error(`Archivo no encontrado: ${filename}`);
    throw new NotFoundException(`Archivo ${filename} no existente.`);
  }
}