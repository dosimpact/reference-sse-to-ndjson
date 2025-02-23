import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // CORS 설정
  app.enableCors({
    origin: 'http://localhost:3000', // Next.js 클라이언트
    methods: ['GET', 'POST'],
    allowedHeaders: ['Content-Type'],
  });

  // 전역 파이프 설정
  app.useGlobalPipes(new ValidationPipe());

  await app.listen(3001);
}
bootstrap();
