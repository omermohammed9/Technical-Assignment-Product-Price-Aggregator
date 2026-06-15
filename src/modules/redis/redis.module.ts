/**
 * @file redis.module.ts
 * @description Global module registering the custom RedisService.
 * Exposes the Redis client utility globally to allow other modules (e.g. Products, Aggregation) to use cache.
 * @module RedisModule
 */

import { Global, Module } from '@nestjs/common';
import { RedisService } from './redis.service';

@Global()
@Module({
  providers: [RedisService],
  exports: [RedisService],
})
export class RedisModule {}
