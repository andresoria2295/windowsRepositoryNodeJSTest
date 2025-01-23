import { IsBoolean, IsDate, IsEmail, IsNotEmpty, IsOptional, IsString, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

class FormacionDto {
    @IsOptional()
    @IsString()
    nombre?: string;
  
    @IsOptional()
    @IsString()
    descripcion?: string;
  
    @IsOptional()
    @IsString()
    nivel?: string;
  
    @IsOptional()
    @IsString()
    institucion?: string;
  
    @IsOptional()
    @IsString()
    duracion?: string;
  
    @IsOptional()
    @IsDate()
    fecha_titulo?: Date;
  
    @IsOptional()
    @IsBoolean()
    activo?: boolean;
  
    @IsOptional()
    @IsString()
    identificador_archivo?: string;
  }
  
class EmpresaDto {
  @IsOptional()
  @IsString()
  nombre?: string;

  @IsOptional()
  @IsString()
  razon_social?: string;

  @IsOptional()
  @IsString()
  direccion?: string;

  @IsOptional()
  @IsString()
  ciudad?: string;

  @IsOptional()
  @IsString()
  pais?: string;

  @IsOptional()
  @IsString()
  telefono?: string;

  @IsOptional()
  @IsString()
  email?: string;

  @IsOptional()
  @IsString()
  sitio_web?: string;

  @IsOptional()
  @IsString()
  industria?: string;

  @IsOptional()
  @IsBoolean()
  estado?: boolean;
}

class EmpleoDto {
  @IsOptional()
  @IsDate()
  fecha_inicio?: Date;

  @IsOptional()
  @IsString()
  posicion?: string;

  @IsOptional()
  @IsBoolean()
  activo?: boolean;
}

export class CreateUserDto {
  @IsNotEmpty()
  @IsString()
  nombre: string;

  @IsNotEmpty()
  @IsString()
  apellido: string;

  @IsNotEmpty()
  @IsDate()
  fecha_nacimiento: Date;

  @IsNotEmpty()
  @IsEmail()
  email: string;

  @IsNotEmpty()
  @IsString()
  contraseña: string;

  @IsOptional()
  @IsString()
  telefono?: string;

  @IsOptional()
  @IsString()
  domicilio?: string;

  @IsOptional()
  @IsString()
  ciudad?: string;

  @IsOptional()
  @IsString()
  pais?: string;

  @IsOptional()
  @ValidateNested()
  @Type(() => FormacionDto)
  formacion?: FormacionDto;
  
  @IsOptional()
  @ValidateNested()
  @Type(() => EmpresaDto)
  empresa?: EmpresaDto;

  @IsOptional()
  @ValidateNested()
  @Type(() => EmpleoDto)
  empleo?: EmpleoDto;
}
