import { Controller, Get, Res, Body, Post, Put, Patch, Param, 
    BadRequestException, Delete, ParseIntPipe, UseInterceptors, 
    UploadedFile, InternalServerErrorException , NotFoundException, Query, HttpStatus } from '@nestjs/common';
import { UserService } from './user.service';
import { Response } from 'express';
import { FileInterceptor } from '@nestjs/platform-express';

@Controller('user')
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Get('user')
  async getUser(@Res() res: Response) {
    try {
      const report = await this.userService.getUser();
      res.status(200).json(report);
    } catch (error) {
      console.error('Error detallado en getUserReport:', error);
      res.status(500).json({ message: 'Error al generar el reporte' });
    }
  }

  //Método GET para obtener un usuario por ID
  @Get('/get-user/:id')
  async getSpecificUser(@Param('id', ParseIntPipe) id: number, @Res() res: Response): Promise<void> {
    try {
      // Aquí se llama al método getSpecificUser correctamente
      const userData = await this.userService.getSpecificUser(id);
      res.status(HttpStatus.OK).json(userData);
    } catch (error) {
      console.error('Error al obtener los datos del usuario:', error);
      res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({ message: 'Error al obtener los datos del usuario' });
    }
  }

  @Post('create-user')
  @UseInterceptors(FileInterceptor('ocupacion[file]')) //Intercepción opcional para manejar el archivo
  async createUser(@Body() newUserData: any, @UploadedFile() file: Express.Multer.File | undefined, @Res() res: Response) {
    try {
      //console.log('Archivo recibido:', file);
      await this.userService.createUser(newUserData, file); //Se pasa el archivo al servicio
      console.log(`Usuario creado exitosamente.`);
      res.status(201).json({ message: 'Usuario creado exitosamente.' });
    } catch (error) {
      console.error('Error detallado:', error); 
      res.status(500).json({ message: 'Error al crear el usuario.', error: error.message });
    }
  }

  @Delete('/delete-user/:id')
  async deleteUser(@Param('id', ParseIntPipe) id: number, @Res() res: Response): Promise<void> {
    try {
      await this.userService.deleteUser(id);
      console.log(`Usuario con ID ${id} eliminado exitosamente.`);
      res.status(200).json({ message: `Usuario con ID ${id} eliminado exitosamente.` });
    } catch (error) {
      console.error('Error al eliminar el usuario:', error);
      throw new InternalServerErrorException('Error al eliminar el usuario.');
    }
  }
}
