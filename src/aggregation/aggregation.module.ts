import { Module } from '@nestjs/common';
import { ProvidersModule } from '../providers/providers.module';
import { PrismaModule } from '../modules/prisma/prisma.module';
import { AggregationService } from './aggregation.service';

@Module({
  imports: [ProvidersModule, PrismaModule],
  providers: [AggregationService],
  exports: [AggregationService],
})
export class AggregationModule {}
