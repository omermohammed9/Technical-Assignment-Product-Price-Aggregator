import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';
import { APP_GUARD } from '@nestjs/core';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import { BullModule } from '@nestjs/bullmq';
import { LoggerModule } from 'nestjs-pino';
import { PrismaModule } from './modules/prisma/prisma.module';
import { ProvidersModule } from './providers/providers.module';
import { AggregationModule } from './aggregation/aggregation.module';
import { ProductsModule } from './products/products.module';
import { RedisModule } from './modules/redis/redis.module';
import { HealthModule } from './health/health.module';
import { AuthModule } from './modules/auth/auth.module';
import { ObservabilityModule } from './modules/observability/observability.module';
import { ApiKeyMiddleware } from './middleware/api-key.middleware';

/**
 * @file app.module.ts
 * @description The root module of the NestJS application. Orchestrates infrastructure modules
 * (BullMQ, Prisma, Redis, Observability/Prometheus, Logger) and domain-specific modules
 * (Auth, Products, Providers, Aggregation, Health), and registers global guards/middlewares.
 * @module AppModule
 */

@Module({
  imports: [
    // Registers scheduler registry support globally
    ScheduleModule.forRoot(),
    // Configures global rate limiting (default: 100 requests per 60 seconds per client)
    ThrottlerModule.forRoot([
      {
        ttl: Number(process.env.THROTTLE_TTL) || 60000,
        limit: Number(process.env.THROTTLE_LIMIT) || 100,
      },
    ]),
    // Configures Pino structured logger (formats JSON in production, pretty print in development)
    LoggerModule.forRoot({
      pinoHttp: {
        level: process.env.LOG_LEVEL || 'info',
        transport:
          process.env.NODE_ENV !== 'production'
            ? {
                target: 'pino-pretty',
                options: {
                  colorize: true,
                  singleLine: true,
                },
              }
            : undefined,
      },
    }),
    // Configures Redis connection parameters for BullMQ asynchronous queue operations
    BullModule.forRoot({
      connection: {
        host: process.env.REDIS_HOST || 'localhost',
        port: Number(process.env.REDIS_PORT) || 6379,
      },
    }),
    PrismaModule,
    ProvidersModule,
    AggregationModule,
    ProductsModule,
    RedisModule,
    HealthModule,
    AuthModule,
    ObservabilityModule,
  ],
  providers: [
    // Register the global Rate Limiting Guard across all endpoints
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
  ],
})
export class AppModule implements NestModule {
  /**
   * Configures middleware execution context.
   * Registers ApiKeyMiddleware globally across all route paths.
   * Internal path exemptions are evaluated dynamically inside ApiKeyMiddleware.
   *
   * @param {MiddlewareConsumer} consumer - Middleware configuration registry
   */
  configure(consumer: MiddlewareConsumer) {
    // Apply API key and JWT hybrid middleware authentication to all routes globally
    consumer.apply(ApiKeyMiddleware).forRoutes('*');
  }
}
