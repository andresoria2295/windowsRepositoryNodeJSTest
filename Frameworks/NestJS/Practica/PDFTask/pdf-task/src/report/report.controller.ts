import { 
  Controller, Get, Res, Body, Post, Put, Patch, Param, 
  BadRequestException, Delete, ParseIntPipe, UseInterceptors, 
  UploadedFile, InternalServerErrorException , NotFoundException, Query
} from '@nestjs/common';
import { ReportService } from './report.service';
import { Response } from 'express';
import { FileInterceptor } from '@nestjs/platform-express';
import * as path from 'path';
import { diskStorage } from 'multer';
import { extname } from 'path'; //Importa extname para obtener la extensión del archivo

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

  @Get('user/:userId/download-pdf')
  async downloadUserPDF(@Param('userId') userId: number, @Res() res: Response, @Query('mode') mode: string): Promise<void> {
    try {
      console.log("ID de usuario recibido:", userId); // Verifica el ID de usuario
  
      const pdfFile = await this.reportService.getUserPDF(userId);
  
      if (!pdfFile) {
        console.error("PDF no encontrado para el usuario con ID:", userId);
        throw new NotFoundException('El archivo PDF no fue encontrado para este usuario.');
      }
  
      console.log("Archivo PDF encontrado para el usuario:", userId);
  
      //Establece los encabezados para la respuesta
      res.set({
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename=user_${userId}.pdf`, //Nombre de archivo
      });
  
      if (mode === 'download') {
        //Fuerza la descarga
        res.send(pdfFile);
      } else {
        //Para vista previa
        res.send(pdfFile);
      }
    } catch (error) {
      console.error("Error en downloadUserPDF:", error.message);
      res.status(500).json({ message: 'Error al intentar descargar el PDF' });
    }
  }

  @Post('user')
  @UseInterceptors(FileInterceptor('ocupacion[file]')) //Intercepción opcional para manejar el archivo
  async createUser(@Body() newUserData: any, @UploadedFile() file: Express.Multer.File | undefined, @Res() res: Response) {
    try {
      console.log('Archivo recibido:', file);
      await this.reportService.createUser(newUserData, file); //Se pasa el archivo al servicio
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

  @Get('occupations/grouped')
  async getGroupedOccupations(@Res() res: Response): Promise<void> {
    try {
      const occupations = await this.reportService.getGroupedOccupations();
      res.status(200).json(occupations);
    } catch (error) {
      console.error('Error al obtener ocupaciones agrupadas:', error);
      res.status(500).json({ message: 'Error al obtener ocupaciones agrupadas' });
    }
  }

 @Get('occupations/grouped-by-title-and-company')
  async getOccupationsByTitleAndCompany(@Res() res: Response): Promise<void> {
    try {
      const occupations = await this.reportService.getOccupationsByTitleAndCompany();
      res.status(200).json(occupations);
    } catch (error) {
      console.error('Error al obtener ocupaciones agrupadas por título y empresa:', error);
      res.status(500).json({ message: 'Error al obtener ocupaciones agrupadas por título y empresa' });
    }
 }
 
 @Get('users/occupation')
 async getUsersByOccupation(@Res() res: Response): Promise<void> {
    try {
      const users = await this.reportService.getUsersByOccupation();
      res.status(200).json(users);
    } catch (error) {
      console.error('Error al obtener usuarios por ocupación:', error);
      res.status(500).json({ message: 'Error al obtener usuarios por ocupación' });
    }
 }

 @Get('users/monthly-new-users')
 async getMonthlyNewUsers(@Res() res: Response): Promise<void> {
    try {
      const users = await this.reportService.getMonthlyNewUsers();
      res.status(200).json(users);
    } catch (error) {
      console.error('Error al obtener nuevos usuarios por mes:', error);
      res.status(500).json({ message: 'Error al obtener nuevos usuarios por mes' });
    }
 }

 @Get('occupations/undocumented')
 async getUndocumented(@Res() res: Response): Promise<void> {
    try {
      const users = await this.reportService.getUndocumented();
      res.status(200).json(users);
    } catch (error) {
      console.error('Error al obtener ocupaciones sin documentación:', error);
      res.status(500).json({ message: 'Error al obtener ocupaciones sin documentación' });
    }
 }

 @Get('users/informal-users')
 async getInformalUsers(@Res() res: Response): Promise<void> {
    try {
      const users = await this.reportService.getInformalUsers();
      res.status(200).json(users);
    } catch (error) {
      console.error('Error al obtener usuarios informales en la actualidad:', error);
      res.status(500).json({ message: 'Error al obtener usuarios informales en la actualidad' });
    }
 }
 
 @Get('users/perpetual-informal-users')
 async getPerpetualInformalUsers(@Res() res: Response): Promise<void> {
    try {
      const users = await this.reportService.getPerpetualInformalUsers();
      res.status(200).json(users);
    } catch (error) {
      console.error('Error al obtener usuarios informales desde que fueron matriculados:', error);
      res.status(500).json({ message: 'Error al obtener usuarios informales desde que fueron matriculados' });
    }
 }

 @Get('users/older-users')
 async getOlderUsers(@Res() res: Response): Promise<void> {
    try {
      const users = await this.reportService.getOlderUsers();
      res.status(200).json(users);
    } catch (error) {
      console.error('Error al obtener usuarios mayores de 50 años:', error);
      res.status(500).json({ message: 'Error al obtener usuarios mayores de 50 años' });
    }
 }

 @Get('users/younger-users')
 async  getYoungerUsers(@Res() res: Response): Promise<void> {
    try {
      const users = await this.reportService.getYoungerUsers();
      res.status(200).json(users);
    } catch (error) {
      console.error('Error al obtener usuarios menores de 35 años:', error);
      res.status(500).json({ message: 'Error al obtener usuarios menores de 35 años' });
    }
 }

 @Get('users/start-working')
 async  getStartWorking(@Res() res: Response): Promise<void> {
    try {
      const users = await this.reportService.getStartWorking();
      res.status(200).json(users);
    } catch (error) {
      console.error('Error al obtener filtrado de usuarios:', error);
      res.status(500).json({ message: 'Error al obtener filtrado de usuarios' });
    }
 }

 @Get('users/formal-job')
 async  getFormalJob(@Res() res: Response): Promise<void> {
    try {
      const users = await this.reportService.getFormalJob();
      res.status(200).json(users);
    } catch (error) {
      console.error('Error al obtener filtrado de usuarios:', error);
      res.status(500).json({ message: 'Error al obtener filtrado de usuarios' });
    }
 }
}
