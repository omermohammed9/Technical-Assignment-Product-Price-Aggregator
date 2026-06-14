import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { join } from 'path';
import * as express from 'express';
import { Logger } from 'nestjs-pino';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, { bufferLogs: true });
  app.useLogger(app.get(Logger));

  // ── Global validation pipe (enables class-validator + class-transformer) ──
  app.useGlobalPipes(
    new ValidationPipe({
      transform: true, // auto-transform query params to declared types
      whitelist: true, // strip unknown properties
      forbidNonWhitelisted: false,
    }),
  );

  // ── Static SSE visualization page ─────────────────────────────────────────
  app.use('/public', express.static(join(__dirname, '..', 'public')));

  // ── Swagger / OpenAPI ─────────────────────────────────────────────────────
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

  const port = process.env.PORT ?? 3000;
  await app.listen(port);
}
bootstrap();
