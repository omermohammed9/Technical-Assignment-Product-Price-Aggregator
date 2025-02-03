import { Module } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';
import { PrismaModule } from './modules/prisma/prisma.module';
import { ProvidersModule } from './providers/providers.module';
import { AggregationModule } from './aggregation/aggregation.module';
import { ProductsModule } from './products/products.module';
// import { ApiKeyMiddleware } from './middleware/api-key.middleware'; // Import Middleware

@Module({
  imports: [
    ScheduleModule.forRoot(),
    PrismaModule,
    ProvidersModule,
    AggregationModule,
    ProductsModule,
  ],
})
export class AppModule {
  // configure(consumer: MiddlewareConsumer) {
  //   consumer.apply(ApiKeyMiddleware).forRoutes('*'); // Apply to all routes
  // }
}
