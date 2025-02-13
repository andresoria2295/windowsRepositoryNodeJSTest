import { Request } from 'express';

declare module 'express' {
  export interface Request {
    fileMetadata?: {
      uuid: string;
      nombre_usuario: string;
      apellido_usuario: string;
    };
  }
}