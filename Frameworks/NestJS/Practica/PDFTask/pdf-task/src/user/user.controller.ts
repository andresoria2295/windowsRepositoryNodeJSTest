import { Controller, Get, Res, Body, Post, Put, Patch, Param, 
    BadRequestException, NotFoundException, Delete, ParseIntPipe, UseInterceptors, 
    UploadedFile, InternalServerErrorException, Query, HttpStatus } from '@nestjs/common';
import { UserService } from './user.service';
import { Response } from 'express';
import { FileInterceptor } from '@nestjs/platform-express';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { PatchUserDto } from './dto/patch-user.dto';
import { DeleteUserDto } from './dto/delete-user.dto';
import { ApiBody, ApiConsumes, ApiTags } from '@nestjs/swagger';

@ApiTags('user')
@Controller('user')
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Post('create-user')
  @UseInterceptors(FileInterceptor('file'))
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    description: 'Crea un nuevo usuario con datos opcionales como empresa, empleo y formación.',
    type: CreateUserDto,
  })

  async createUser(
    @Body() newUserData: CreateUserDto,
    @UploadedFile() file: Express.Multer.File | undefined,
    @Res() res: Response,
  ) {
    try {
      // Normaliza el nombre del campo 'contraseÃ±a' a 'contraseña' si es necesario
      if (newUserData['contraseÃ±a']) {
        newUserData['contraseña'] = newUserData['contraseÃ±a'];
        delete newUserData['contraseÃ±a'];
      }

      // Procesa el archivo si se proporciona
      if (file) {
        const fileUUID = await this.userService.sendFile(file, newUserData.nombre, newUserData.apellido);
        // Agrega el UUID del archivo a la formación del usuario
        newUserData.formacion = {
          ...(newUserData.formacion || {}),
          identificador_archivo: fileUUID,
        };
      }

      // Envía los datos al servicio para crear el usuario
      console.log('Datos enviados al servicio:', newUserData);
      await this.userService.createUser(newUserData);

      // Responde con éxito
      res.status(201).json({ message: 'Usuario creado exitosamente.' });
    } catch (error) {
      console.error('Error al crear usuario:', error.message);
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

  @Get('file/:userId')
  async getFileByUser(@Param('userId') userId: number, @Res() res: Response) {
    console.log('ID de usuario recibido:', userId);
    return this.userService.getFileByUser(userId, res);
  }

  @Patch('update-user/fields/:id')
  @UseInterceptors(FileInterceptor('file'))
  async updateUserFields(
    @Param('id', ParseIntPipe) id: number,
    @Body() updatedData: PatchUserDto,
    @UploadedFile() file: Express.Multer.File,
  ): Promise<void> {
    //Normaliza el campo contraseña si existe
    if (updatedData['contraseÃ±a']) {
      updatedData['contraseña'] = updatedData['contraseÃ±a'];
      delete updatedData['contraseÃ±a'];
    }

    //Si hay un archivo, se agrega a formacion.archivo para que updateUserFields lo procese
    if (file) {
      console.log('Archivo recibido:', {
        originalname: file.originalname,
        mimetype: file.mimetype,
        size: file.size,
      });
      
      //Inicializa formacion si no existe
      if (!updatedData.formacion) {
        updatedData.formacion = {};
      }
      
      //Agrega el archivo al objeto de formación
      updatedData.formacion.archivo = file;
    }

    //Llamar al método de servicio que ya maneja la lógica de obtener nombre/apellido
    await this.userService.updateUserFields(id, updatedData);
  }
  
  @Put('update-user/:id')
  @UseInterceptors(FileInterceptor('file'))
  async updateUser(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateUserDto: UpdateUserDto,
    @UploadedFile() file: Express.Multer.File,
  ): Promise<{ message: string }> {
    let identificador_archivo: string | null = null;

    //Normaliza el nombre del campo 'contraseÃ±a' a 'contraseña'
    if (updateUserDto['contraseÃ±a']) {
      updateUserDto['contraseña'] = updateUserDto['contraseÃ±a'];
      delete updateUserDto['contraseÃ±a'];
    }

    //Verifica si se recibió un archivo
    if (file) {
      try {
        //Si no hay nombre y apellido en el DTO, se adquieren los datos del usuario.
        if (!updateUserDto.nombre || !updateUserDto.apellido) {
          const userData = await this.userService.getUserById(id);
          if (!userData) {
            throw new NotFoundException(`Usuario con ID ${id} no encontrado`);
          }
          
          //Uso de los datos existentes si no están en el DTO
          const nombre = updateUserDto.nombre || userData.Nombre;
          const apellido = updateUserDto.apellido || userData.Apellido;
          
          //Envío de archivo a la API B con los datos correctos
          identificador_archivo = await this.userService.sendFile(file, nombre, apellido);
        } else {
          //Si hay nombre y apellido en el DTO, se los usa directamente
          identificador_archivo = await this.userService.sendFile(
            file, 
            updateUserDto.nombre, 
            updateUserDto.apellido
          );
        }
        
        //Agrega el UUID al campo correspondiente en `formacion`
        if (identificador_archivo) {
          updateUserDto.formacion = {
            ...updateUserDto.formacion,
            identificador_archivo,
          };
        }
      } catch (error) {
        console.error('Error al procesar el archivo:', error);
        throw new BadRequestException(
          `Error al procesar el archivo: ${error.message}`
        );
      }
    }

    //Llama al servicio para actualizar el usuario con el DTO actualizado
    await this.userService.updateUser(id, updateUserDto);

    return { message: `Usuario con ID ${id} actualizado exitosamente.` };
  }
    
  @Delete('/delete-user/:userId')
  async deleteUser(@Param() params: DeleteUserDto,  @Res() res: Response): Promise<void> {
    const { userId } = params;
    try {
      await this.userService.deleteUser(userId);
      console.log(`Usuario con ID ${userId} eliminado exitosamente.`);
      res.status(200).json({ message: `Usuario con ID ${userId} eliminado exitosamente.` });
    } catch (error) {
      console.error('Error al eliminar el usuario:', error);
      throw new InternalServerErrorException('Error al eliminar el usuario.');
    }
  }
}
