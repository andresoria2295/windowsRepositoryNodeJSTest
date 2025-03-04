import {IsOptional, IsString, IsEmail, IsDateString, IsNumber, IsBoolean, ValidateNested} from 'class-validator';
import { Type } from 'class-transformer';
  
  class PatchFormacionDto {
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
    @IsDateString()
    fecha_titulo?: string;
  
    @IsOptional()
    @IsBoolean()
    activo?: boolean;
  
    @IsOptional()
    @IsString()
    identificador_archivo?: string;

    @IsOptional()
    archivo?: Express.Multer.File;
}
  
  class PatchEmpresaDto {
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
    @IsEmail()
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
  
  class PatchEmpleoDto {
    @IsOptional()
    @IsNumber()
    id_empleo?: number;
  
    @IsOptional()
    @IsDateString()
    fecha_inicio?: string;
  
    @IsOptional()
    @IsDateString()
    fecha_fin?: string | null;
  
    @IsOptional()
    @IsString()
    posicion?: string;
  
    @IsOptional()
    @IsBoolean()
    activo?: boolean;
  }
  
  export class PatchUserDto {
    @IsOptional()
    @IsNumber()
    userId?: number;
  
    @IsOptional()
    @IsString()
    nombre?: string;
  
    @IsOptional()
    @IsString()
    apellido?: string;
  
    @IsOptional()
    @IsDateString()
    fecha_nacimiento?: string;
  
    @IsOptional()
    @IsEmail()
    email?: string;
  
    @IsOptional()
    @IsString()
    contraseña?: string;
  
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
    @Type(() => PatchFormacionDto)
    formacion?: PatchFormacionDto;
  
    @IsOptional()
    @ValidateNested()
    @Type(() => PatchEmpresaDto)
    empresa?: PatchEmpresaDto;
  
    @IsOptional()
    @ValidateNested()
    @Type(() => PatchEmpleoDto)
    empleo?: PatchEmpleoDto;
  }
  