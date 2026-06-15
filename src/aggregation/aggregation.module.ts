import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { ProvidersModule } from '../providers/providers.module';
import { PrismaModule } from '../modules/prisma/prisma.module';
import { AggregationService } from './aggregation.service';
import { RedisModule } from '../modules/redis/redis.module';

@Module({
  imports: [
    ProvidersModule,
    PrismaModule,
    RedisModule,
    BullModule.registerQueue({
      name: 'aggregation',
    }),
  ],
  providers: [AggregationService],
  exports: [AggregationService],
})
export class AggregationModule {}
