import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Middleware para registrar las solicitudes entrantes
  app.use((req, res, next) => {
    console.log(`Solicitud recibida: ${req.method} ${req.url}`);
    next();
  });

  // Configuración del puerto
  const port = process.env.PORT || 4000;

  // Mensaje al iniciar el servidor
  await app.listen(port, () => {
    console.log(`API B escuchando en el puerto ${port}`);
  });
}

bootstrap();
