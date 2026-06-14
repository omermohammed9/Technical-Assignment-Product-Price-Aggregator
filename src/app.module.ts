import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';
import { APP_GUARD } from '@nestjs/core';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import { LoggerModule } from 'nestjs-pino';
import { PrismaModule } from './modules/prisma/prisma.module';
import { ProvidersModule } from './providers/providers.module';
import { AggregationModule } from './aggregation/aggregation.module';
import { ProductsModule } from './products/products.module';
import { RedisModule } from './modules/redis/redis.module';
import { HealthModule } from './health/health.module';
import { ApiKeyMiddleware } from './middleware/api-key.middleware';

@Module({
  imports: [
    ScheduleModule.forRoot(),
    ThrottlerModule.forRoot([
      {
        ttl: Number(process.env.THROTTLE_TTL) || 60000,
        limit: Number(process.env.THROTTLE_LIMIT) || 100,
      },
    ]),
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
    PrismaModule,
    ProvidersModule,
    AggregationModule,
    ProductsModule,
    RedisModule,
    HealthModule,
  ],
  providers: [
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
  ],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    // Apply API key guard to all routes
    consumer.apply(ApiKeyMiddleware).forRoutes('*');
  }
}
