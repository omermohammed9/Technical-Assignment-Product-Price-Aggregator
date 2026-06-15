/**
 * @file aggregation.module.ts
 * @description Module orchestrating the background pricing and availability aggregator.
 * Registers the 'aggregation' BullMQ message queue and binds the AggregationService processor.
 * @module AggregationModule
 */

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
    // Registers the 'aggregation' BullMQ queue for job scheduling and tracking
    BullModule.registerQueue({
      name: 'aggregation',
    }),
  ],
  providers: [AggregationService],
  exports: [AggregationService],
})
export class AggregationModule {}
