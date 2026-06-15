/**
 * @file providers.module.ts
 * @description Module registering the external provider API interaction services.
 * Registers and exports ProvidersService and registers ProvidersController for local mock endpoints testing.
 * @module ProvidersModule
 */

import { Module } from '@nestjs/common';
import { ProvidersController } from './providers.controller';
import { ProvidersService } from './providers.service';

@Module({
  providers: [ProvidersService],
  controllers: [ProvidersController],
  exports: [ProvidersService],
})
export class ProvidersModule {}
