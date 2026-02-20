import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import helmet from 'helmet';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const configService = app.get(ConfigService);

  // CORS - must be before helmet
  const corsOrigin = configService.get('CORS_ORIGIN', 'http://localhost:3000');
  app.enableCors({
    origin: (origin, callback) => {
      // Allow requests with no origin (mobile apps, curl, etc.)
      if (!origin) return callback(null, true);
      // Allow configured origin
      if (origin === corsOrigin) return callback(null, true);
      // Allow any GitHub Codespaces origin
      if (origin.endsWith('.app.github.dev')) return callback(null, true);
      // Allow localhost variants
      if (/^https?:\/\/localhost(:\d+)?$/.test(origin)) return callback(null, true);
      callback(new Error(`CORS not allowed for origin: ${origin}`));
    },
    credentials: true,
    methods: ['GET', 'HEAD', 'PUT', 'PATCH', 'POST', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'Accept', 'X-Requested-With'],
    exposedHeaders: ['Content-Range', 'X-Content-Range'],
    preflightContinue: false,
    optionsSuccessStatus: 204,
  });

  // Security - configure helmet to not interfere with CORS in Codespaces
  app.use(
    helmet({
      crossOriginResourcePolicy: { policy: 'cross-origin' },
      crossOriginOpenerPolicy: false,
      crossOriginEmbedderPolicy: false,
    }),
  );

  // Global prefix
  app.setGlobalPrefix('api/v1');

  // Validation
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: {
        enableImplicitConversion: true,
      },
    }),
  );

  // Swagger documentation
  const config = new DocumentBuilder()
    .setTitle('Trinity Management System API')
    .setDescription('API for managing sound/event business operations')
    .setVersion('1.0')
    .addBearerAuth()
    .addTag('Authentication', 'User authentication endpoints')
    .addTag('Users', 'User management (Admin only)')
    .addTag('Equipment', 'Equipment inventory management')
    .addTag('Clients', 'Client management')
    .addTag('Events', 'Event management and booking')
    .addTag('Action Logs', 'System action logs')
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document);

  const port = configService.get('PORT', 3001);
  await app.listen(port);

  console.log(`🚀 Trinity Management API running on: http://localhost:${port}`);
  console.log(`📚 API Documentation: http://localhost:${port}/api/docs`);
}

bootstrap();
