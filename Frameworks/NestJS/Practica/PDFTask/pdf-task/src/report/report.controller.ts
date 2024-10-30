import { 
  Controller, Get, Res, Body, Post, Put, Patch, Param, 
  BadRequestException, Delete, ParseIntPipe, UseInterceptors, 
  UploadedFile, InternalServerErrorException 
} from '@nestjs/common';
import { ReportService } from './report.service';
import { Response } from 'express';
import { FileInterceptor } from '@nestjs/platform-express';
import * as path from 'path';
import { diskStorage } from 'multer';
import { extname } from 'path'; // Importar extname para obtener la extensión del archivo

@Controller('report')
export class ReportController {
  constructor(private readonly reportService: ReportService) {}

  @Get('user')
  async getUserReport(@Res() res: Response) {
    try {
      const report = await this.reportService.getUserReport();
      res.status(200).json(report);
    } catch (error) {
      console.error('Error detallado en getUserReport:', error);
      res.status(500).json({ message: 'Error al generar el reporte' });
    }
  }

  @Post('user')
  @UseInterceptors(FileInterceptor('ocupacion[file]')) // Interceptor opcional para manejar el archivo
  async createUser(@Body() newUserData: any, @UploadedFile() file: Express.Multer.File | undefined, @Res() res: Response) {
    try {
      console.log('Archivo recibido:', file);
      await this.reportService.createUser(newUserData, file); // Pasamos el archivo al servicio
      res.status(201).json({ message: 'Usuario creado exitosamente' });
    } catch (error) {
      console.error('Error detallado:', error); 
      res.status(500).json({ message: 'Error al crear el usuario', error: error.message });
    }
  }
  
@Put('/user/:id')
async updateUser(@Param('id') userId: number, @Body() updatedData: any): Promise<void> {
  const { nombre, apellido, fecha_nacimiento, email } = updatedData;

  if (!nombre || !apellido || !fecha_nacimiento || !email) {
    throw new BadRequestException('Los campos "nombre", "apellido", "fecha_nacimiento" y "email" son obligatorios.');
  }

  try {
    await this.reportService.updateUser(userId, updatedData);
  } catch (error) {
    console.error('Error al actualizar el usuario:', error);
    throw new BadRequestException('Error al actualizar el usuario');
  }
}

  @Patch('/user/:id')
  @UseInterceptors(FileInterceptor('ocupacion[file]'))  //Interceptor para manejar el archivo
  async updateFileUser(
  @Param('id') userId: number,
  @Body() updatedData: any,
  @UploadedFile() file: Express.Multer.File,
): Promise<void> {
  try {
    await this.reportService.updateFileUser(userId, updatedData, file); //Pasa el archivo al servicio
  } catch (error) {
    console.error('Error al actualizar el usuario:', error);
    throw new BadRequestException('Error al actualizar el usuario');
  }
}

@Patch('/user/:id/fields')
async updateUserFields(@Param('id') userId: number, @Body() updatedData: any): Promise<void> {
  try {
    await this.reportService.updateUserFields(userId, updatedData);
  } catch (error) {
    console.error('Error al actualizar el usuario:', error);
    throw new BadRequestException('Error al actualizar el usuario');
  }
}

  @Delete('/user/:id')
  async deleteUser(@Param('id', ParseIntPipe) id: number): Promise<void> {
    try {
      await this.reportService.deleteUser(id);
    } catch (error) {
      console.error('Error al eliminar el usuario:', error);
      throw new InternalServerErrorException('Error al eliminar el usuario');
    }
  }
}
