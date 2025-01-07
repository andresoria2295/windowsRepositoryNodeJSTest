import { Controller, Get, Res, Body, Post, Put, Patch, Param, 
    BadRequestException, Delete, ParseIntPipe, UseInterceptors, 
    UploadedFile, InternalServerErrorException , NotFoundException, Query, HttpStatus } from '@nestjs/common';
import { UserService } from './user.service';
import { Response } from 'express';
import { FileInterceptor } from '@nestjs/platform-express';

@Controller('user')
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Post('create-user')
  @UseInterceptors(FileInterceptor('file')) // Cambiar a 'file'
  async createUser(
    @Body() newUserData: any,
    @UploadedFile() file: Express.Multer.File | undefined,
    @Res() res: Response,
  ) {
  //Normaliza el nombre del campo 'contraseÃ±a' a 'contraseña'
  if (newUserData['contraseÃ±a']) {
    newUserData['contraseña'] = newUserData['contraseÃ±a'];
    delete newUserData['contraseÃ±a'];
  }
  try {
    //Verifica si el archivo es opcional o necesario según la lógica
    if (file) {
      //Envía el archivo a la API B y obtiene el UUID
      const fileUUID = await this.userService.sendFile(file);
      newUserData.formacion = {
        ...(newUserData.formacion || {}),
        identificador_archivo: fileUUID,
      };
    }
    console.log('Datos enviados al servicio:', newUserData);
    //Crea el usuario en la base de datos
    await this.userService.createUser(newUserData, file);
    console.log(`Usuario creado exitosamente.`);
    res.status(201).json({ message: 'Usuario creado exitosamente.' });
  } catch (error) {
    console.error('Error detallado:', error);
    res.status(500).json({ message: 'Error al crear el usuario.', error: error.message });
  }
}
  
  @Get('get-user')
    async getAllUsers(@Res() res: Response) {
        try {
            const users = await this.userService.getAllUsers();
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
      const userData = await this.userService.getSpecificUser(id);
      res.status(HttpStatus.OK).json(userData);
    } catch (error) {
      console.error('Error al obtener los datos del usuario:', error);
      res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({ message: 'Error al obtener los datos del usuario.' });
    }
  }

  @Patch('update-user/fields/:id')
    async updateUserFields(@Param('id') userId: number, @Body() data: any): Promise<any> {
        try {
            await this.userService.updateUserFields(userId, data);
            return { message: 'Campos actualizados correctamente.' };
        } catch (error) {
            console.error('Error en updateUser:', error);
            throw new BadRequestException('Error al actualizar el usuario.');
        }
    }
  
  @Put('update-user/:id')
  @UseInterceptors(FileInterceptor('file'))
  async updateUser(
    @Param('id') id: number,
    @Body() updatedData: any,
    @UploadedFile() file: Express.Multer.File,
  ): Promise<void> {
    let identificador_archivo: string | null = null;
    
    //Normaliza el nombre del campo 'contraseÃ±a' a 'contraseña'
    if (updatedData['contraseÃ±a']) {
      updatedData['contraseña'] = updatedData['contraseÃ±a'];
      delete updatedData['contraseÃ±a'];
    }
    
    if (file) {
      //Envía el archivo a la API B y recibe el UUID
      identificador_archivo = await this.userService.sendFile(file);
    }
    
    //Agrega el UUID al cuerpo de datos actualizado, si se recibió
    if (identificador_archivo) {
      updatedData.formacion = {
        ...updatedData.formacion,
        identificador_archivo,
      };
    }
    
    await this.userService.updateUser(id, updatedData);
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
