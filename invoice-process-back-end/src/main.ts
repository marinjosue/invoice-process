import * as dns from 'dns';
// Forzar DNS público ANTES de cargar Mongoose: el resolver de Node (c-ares)
// falla con "querySrv ECONNREFUSED" cuando el DNS del sistema es IPv6 link-local (fe80::1).
dns.setServers(['8.8.8.8', '8.8.4.4']);

import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { NestExpressApplication } from '@nestjs/platform-express';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { apiReference } from '@scalar/nestjs-api-reference';
import { AppModule } from './app.module';
import { join } from 'path';
import { GoogleCloudConfig } from './config/google-cloud.config';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);

  // CORS
  app.enableCors();

  // Servir archivos estáticos de uploads
  app.useStaticAssets(join(__dirname, '..', 'uploads'), {
    prefix: '/uploads',
  });

  // Validación global
  app.useGlobalPipes(new ValidationPipe({
    whitelist: true,
    transform: true,
    forbidNonWhitelisted: false,
    transformOptions: {
      enableImplicitConversion: true,
    },
  }));

  // Prefijo global
  app.setGlobalPrefix('api');

  // Configurar Swagger/OpenAPI
  const config = new DocumentBuilder()
    .setTitle('Sistema de Liquidaciones API')
    .setDescription('API para gestión de liquidaciones, facturas, productos y proveedores')
    .setVersion('1.0.0')
    .addBearerAuth(
      {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
      },
      'bearer',
    )
    .build();

  const document = SwaggerModule.createDocument(app, config);

  // Configurar Swagger/OpenAPI
  // Swagger UI
  SwaggerModule.setup('swagger', app, document);

  // Scalar (API Reference)
  app.use(
    '/api-docs',
    apiReference({
      url: '/swagger-json',
    }),
  );

  // Inicializar Google Cloud Storage
  try {
    await GoogleCloudConfig.ensureBucketExists();
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error('⚠️  Advertencia: No se pudo inicializar Google Cloud Storage:', message);
  }

  const port = process.env.PORT || 5000;
  // Cloud Run requires binding to 0.0.0.0, not just localhost (127.0.0.1)
  await app.listen(port, '0.0.0.0');
  console.log(`🚀 Application is running on: http://0.0.0.0:${port}`);
  console.log(`Documentación Scalar en http://0.0.0.0:${port}/api-docs`);
}
bootstrap();
