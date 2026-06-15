/**
 * @file products.module.ts
 * @description Module encapsulating the Products catalog APIs.
 * Connects PrismaModule for database access and registers ProductsController and ProductsService.
 * @module ProductsModule
 */

import { Module } from '@nestjs/common';
import { ProductsService } from './products.service';
import { ProductsController } from './products.controller';
import { PrismaModule } from '../modules/prisma/prisma.module';

@Module({
  imports: [PrismaModule], // Bind global PrismaModule dependency
  controllers: [ProductsController],
  providers: [ProductsService],
  exports: [ProductsService],
})
export class ProductsModule {}
