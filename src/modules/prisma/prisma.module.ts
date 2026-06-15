/**
 * @file prisma.module.ts
 * @description Global database access module wrapping PrismaClient.
 * Declares and exports PrismaService to allow any module in the application to perform SQL database transactions.
 * @module PrismaModule
 */

import { Global, Module } from '@nestjs/common';
import { PrismaService } from './prisma.service';

@Global() // Makes PrismaService globally available across the application without requiring explicit re-importing
@Module({
  providers: [PrismaService],
  exports: [PrismaService],
})
export class PrismaModule {}
