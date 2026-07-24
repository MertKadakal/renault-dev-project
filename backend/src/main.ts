import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  
  // Frontend'den gelen isteklere izin ver
  app.enableCors({
    origin: 'http://localhost:4200',
    credentials: true,
  });

  app.setGlobalPrefix('api'); // Tüm API endpoint'leri /api ile başlar
  await app.listen(3000);
}
bootstrap();