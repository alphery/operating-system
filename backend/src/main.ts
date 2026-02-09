import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
  console.log('Starting Alphery OS Backend... (Build Triggered)');
  const app = await NestFactory.create(AppModule);

  // Enable CORS for development and production
  app.enableCors({
    origin: function (origin, callback) {
      // Allow requests with no origin (like mobile apps or curl requests)
      if (!origin) return callback(null, true);

      // Allow localhost (any port) and Vercel deployments
      if (origin.match(/^http:\/\/localhost:\d+$/) || origin.match(/\.vercel\.app$/) || origin === process.env.CORS_ORIGIN) {
        return callback(null, true);
      } else {
        console.warn(`Blocked CORS request from origin: ${origin}`);
        return callback(new Error('Not allowed by CORS'), false);
      }
    },
    credentials: true,
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
    allowedHeaders: 'Content-Type, Accept, Authorization, X-Tenant-ID',
  });

  const port = process.env.PORT || 3001;
  console.log(`📡 Attempting to start server on port: ${port}`);
  await app.listen(port);

  console.log(`🚀 Backend running on port ${port}`);
  console.log(`📡 Environment: ${process.env.NODE_ENV || 'development'}`);
}
bootstrap();
