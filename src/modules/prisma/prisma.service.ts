/**
 * @file prisma.service.ts
 * @description Prisma client service managing the active PostgreSQL database connection pool.
 * Implements NestJS OnModuleInit and OnModuleDestroy hooks to manage database connections cleanly.
 * @module PrismaService
 */

import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

@Injectable()
export class PrismaService
  extends PrismaClient
  implements OnModuleInit, OnModuleDestroy
{
  /**
   * Automatically connects to the database when the containing module is initialized.
   */
  async onModuleInit() {
    await this.$connect();
  }

  /**
   * Automatically cleans up the database connection pool when the application is shut down.
   */
  async onModuleDestroy() {
    await this.$disconnect();
  }
}
