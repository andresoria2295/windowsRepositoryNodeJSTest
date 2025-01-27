import { IsOptional, IsString, IsEmail, IsDateString, IsNumber, IsBoolean, ValidateNested, IsObject } from 'class-validator';
import { Type } from 'class-transformer';

class UpdateFormacionDto {
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
}

class UpdateEmpresaDto {
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

class UpdateEmpleoDto {
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

export class UpdateUserDto {
  @IsNumber()
  userId: number;

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
  @Type(() => UpdateFormacionDto)
  formacion?: UpdateFormacionDto;

  @IsOptional()
  @ValidateNested()
  @Type(() => UpdateEmpresaDto)
  empresa?: UpdateEmpresaDto;

  @IsOptional()
  @ValidateNested()
  @Type(() => UpdateEmpleoDto)
  empleo?: UpdateEmpleoDto;
}
