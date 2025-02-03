import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../modules/prisma/prisma.service';
import { GetProductsDto } from './dto/get-products.dto';
import { GetProductChangesDto } from './dto/get-product-changes.dto';
import { EventEmitter } from 'events';

@Injectable()
export class ProductsService {
  private readonly logger = new Logger(ProductsService.name);
  private eventEmitter = new EventEmitter(); // Real-time events

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Fetch all products with optional filters and pagination.
   */
  async getAllProducts(filters: GetProductsDto) {
    this.logger.log('Filtering products with:', filters);

    const { page = 1, limit = 10, ...queryFilters } = filters;
    const skip = (page - 1) * limit;

    const whereClause: any = {
      ...(queryFilters.name && {
        name: { contains: queryFilters.name, mode: 'insensitive' },
      }),
      ...(queryFilters.minPrice && {
        price: { gte: Number(queryFilters.minPrice) },
      }),
      ...(queryFilters.maxPrice && {
        price: { lte: Number(queryFilters.maxPrice) },
      }),
      ...(typeof queryFilters.availability === 'string' && {
        availability: queryFilters.availability === 'true',
      }),
      ...(queryFilters.provider && {
        provider: { contains: queryFilters.provider, mode: 'insensitive' },
      }),
    };

    const total = await this.prisma.product.count({ where: whereClause });
    const products = await this.prisma.product.findMany({
      where: whereClause,
      skip,
      take: limit,
    });

    return {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
      data: products,
    };
  }

  /**
   * Fetch a single product by ID including price history.
   */
  async getProductById(id: number) {
    return this.prisma.product.findUnique({
      where: { id },
      include: { history: true },
    });
  }

  /**
   * Fetch products with price or availability changes within a timeframe and pagination.
   */
  async getProductChanges(filters: GetProductChangesDto) {
    this.logger.log('Fetching product changes:', filters);

    const { page = 1, limit = 10, ...queryFilters } = filters;
    const skip = (page - 1) * limit;

    const whereClause: any = {
      ...(queryFilters.startDate && {
        timestamp: { gte: new Date(queryFilters.startDate) },
      }),
      ...(queryFilters.endDate && {
        timestamp: { lte: new Date(queryFilters.endDate) },
      }),
    };

    const total = await this.prisma.priceHistory.count({ where: whereClause });
    const changes = await this.prisma.priceHistory.findMany({
      where: whereClause,
      include: { Product: true },
      orderBy: { timestamp: 'desc' },
      skip,
      take: limit,
    });

    return {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
      data: changes.map((change) => ({
        id: change.Product?.id,
        name: change.Product?.name ?? 'Unknown Product',
        oldPrice: change.price,
        newPrice: change.Product?.price ?? 0,
        timestamp: change.timestamp,
      })),
    };
  }

  /**
   * Get the most recent price changes for real-time updates.
   */
  async getLatestChanges() {
    const latestChanges = await this.prisma.priceHistory.findMany({
      take: 5,
      orderBy: { timestamp: 'desc' },
      include: { Product: true },
    });

    return latestChanges.map((change) => ({
      id: change.Product?.id,
      name: change.Product?.name ?? 'Unknown Product',
      oldPrice: change.price,
      newPrice: change.Product?.price ?? 0,
      timestamp: change.timestamp,
    }));
  }

  /**
   * Update a product's price & store price history in a single transaction.
   */
  async updateProductPrice(productId: number, newPrice: number) {
    const existingProduct = await this.prisma.product.findUnique({
      where: { id: productId },
    });

    if (!existingProduct) {
      this.logger.warn(`Product ID ${productId} not found.`);
      return null;
    }

    if (existingProduct.price === newPrice) {
      this.logger.log(`No price change detected for Product ${productId}.`);
      return existingProduct;
    }

    this.logger.log(
      `Updating price for Product ${productId} from $${existingProduct.price} to $${newPrice}`,
    );

    // Emit real-time update event
    this.eventEmitter.emit('product-update', {
      id: productId,
      name: existingProduct.name,
      oldPrice: existingProduct.price,
      newPrice,
      timestamp: new Date(),
    });

    return this.prisma.$transaction(async (tx) => {
      // Store price change history
      await tx.priceHistory.create({
        data: { productId: existingProduct.id, price: existingProduct.price },
      });

      // Update the product price
      return tx.product.update({
        where: { id: productId },
        data: { price: newPrice },
      });
    });
  }
}
