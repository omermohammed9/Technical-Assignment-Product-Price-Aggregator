/**
 * @file health.module.ts
 * @description Health module. Imports PrismaModule to facilitate database connectivity checks.
 * @module HealthModule
 */

import { Module } from '@nestjs/common';
import { HealthController } from './health.controller';
import { PrismaModule } from '../modules/prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [HealthController],
})
export class HealthModule {}
