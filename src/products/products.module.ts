import { Module } from '@nestjs/common';
import { ProductsService } from './products.service';
import { ProductsController } from './products.controller';
import { PrismaModule } from '../modules/prisma/prisma.module';

@Module({
  imports: [PrismaModule], // Import PrismaModule for DB access
  controllers: [ProductsController], // Register controller
  providers: [ProductsService], // Register service
  exports: [ProductsService], // Export service if needed elsewhere
})
export class ProductsModule {}
