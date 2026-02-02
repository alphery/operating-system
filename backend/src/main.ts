import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Enable CORS for development and production
  app.enableCors({
    origin: [
      'http://localhost:3000',
      /\.vercel\.app$/,  // Allow all Vercel domains
      process.env.CORS_ORIGIN,  // Custom origin from env
    ].filter(Boolean),  // Remove undefined values
    credentials: true,
  });

  const port = process.env.PORT || 3001;
  await app.listen(port);

  console.log(`🚀 Backend running on port ${port}`);
  console.log(`📡 Environment: ${process.env.NODE_ENV || 'development'}`);
}
bootstrap();
