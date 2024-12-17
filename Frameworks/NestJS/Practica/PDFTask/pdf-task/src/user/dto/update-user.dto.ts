// src/user/dto/update-user.dto.ts

export class UpdateUserDto {
    nombre: string;
    apellido: string;
    fecha_nacimiento: string; // O Date dependiendo de cómo gestionas las fechas
    email: string;
    contraseña: string;
    telefono: string;
    domicilio: string;
    ciudad: string;
    pais: string;
    formacion: {
      nombre: string;
      descripcion: string;
      nivel: string;
      institucion: string;
      duracion: string;
      fecha_titulo: string;
      activo: boolean;
      identificador_archivo: string;
    };
    empresa: {
      nombre: string;
      razon_social: string;
      direccion: string;
      ciudad: string;
      pais: string;
      telefono: string;
      email: string;
      sitio_web: string;
      industria: string;
      estado: boolean;
    };
    empleo: {
      id_empleo: number;
      fecha_inicio: string;
      fecha_fin: string | null;
      posicion: string;
      activo: boolean;
    };
  }
  