import { 
  Controller, Get, Res, Body, Post, Put, Patch, Param, 
  BadRequestException, Delete, ParseIntPipe, UseInterceptors, 
  UploadedFile, InternalServerErrorException , NotFoundException, Query, HttpStatus
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

 @Get('get-user')
     async getAllUsers(@Res() res: Response) {
         try {
             const users = await this.reportService.getAllUsers();
             res.status(200).json(users);
         } catch (error) {
             console.error('Error al obtener todos los usuarios:', error);
             res.status(500).json({ message: 'Error al obtener todos los usuarios.' });
         }
     }
 
   //Método GET para obtener un usuario por ID
   @Get('/get-user/:id')
   async getSpecificUser(@Param('id', ParseIntPipe) id: number, @Res() res: Response): Promise<void> {
     try {
       // Aquí se llama al método getSpecificUser correctamente
       const userData = await this.reportService.getSpecificUser(id);
       res.status(HttpStatus.OK).json(userData);
     } catch (error) {
       console.error('Error al obtener los datos del usuario:', error);
       res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({ message: 'Error al obtener los datos del usuario.' });
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
