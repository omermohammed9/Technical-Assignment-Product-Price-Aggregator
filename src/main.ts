/**
 * @file main.ts
 * @description Entry point for the NestJS application. Initializes the NestJS application instance,
 * configures global middleware (CORS, global ValidationPipe, Pino structured logging), serves static public assets,
 * sets up Swagger/OpenAPI documentation, and starts the HTTP server on the configured port.
 * @module main
 */

import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { join } from 'path';
import * as express from 'express';
import { Logger } from 'nestjs-pino';

/**
 * Bootstraps the NestJS application.
 * Establishes structured logging, global request validation, static asset routes, CORS policies,
 * OpenAPI documentation, and listens on the specified network port.
 */
async function bootstrap() {
  // Create NestJS app instance with buffered logging to enable early-stage Pino logging capture
  const app = await NestFactory.create(AppModule, { bufferLogs: true });
  app.useLogger(app.get(Logger));

  // Enable CORS globally to permit cross-origin requests from the Vite React frontend
  app.enableCors();

  // ── Global validation pipe (enables class-validator + class-transformer) ──
  app.useGlobalPipes(
    new ValidationPipe({
      transform: true, // Automatically transforms request payloads/query params to declared DTO classes/types
      whitelist: true, // Automatically strips properties not explicitly defined in the DTO class
      forbidNonWhitelisted: false,
    }),
  );

  // ── Static SSE visualization page ─────────────────────────────────────────
  // Serves public assets (e.g. legacy/testing static SSE UI dashboard)
  app.use('/public', express.static(join(__dirname, '..', 'public')));

  // ── Swagger / OpenAPI ─────────────────────────────────────────────────────
  // Generates API specification exposed at /api endpoint for interactive documentation
  const config = new DocumentBuilder()
    .setTitle('Product Price Aggregator API')
    .setDescription(
      'Aggregates pricing and availability data for digital products from multiple simulated providers. ' +
        'Real-time updates via SSE at GET /products/live-changes.',
    )
    .setVersion('1.0')
    .addApiKey({ type: 'apiKey', name: 'x-api-key', in: 'header' }, 'api-key')
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api', app, document);

  // Listen on environment port or default to 3000
  const port = process.env.PORT ?? 3000;
  await app.listen(port);
}
bootstrap();
