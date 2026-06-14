import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { Subject } from 'rxjs';
import { PrismaService } from '../modules/prisma/prisma.service';
import { GetProductsDto } from './dto/get-products.dto';
import { GetProductChangesDto } from './dto/get-product-changes.dto';
import { RedisService } from '../modules/redis/redis.service';

export interface ProductChangeEvent {
  id: number;
  name: string;
  oldPrice: number;
  newPrice: number;
  timestamp: Date;
}

@Injectable()
export class ProductsService {
  private readonly logger = new Logger(ProductsService.name);

  /**
   * Hot Observable that SSE clients subscribe to.
   * AggregationService pushes events here; the controller streams them to clients.
   */
  readonly productChanges$ = new Subject<ProductChangeEvent>();

  constructor(
    private readonly prisma: PrismaService,
    private readonly redis: RedisService,
  ) {}

  // ── GET /products ──────────────────────────────────────────────────────────

  async getAllProducts(filters: GetProductsDto) {
    this.logger.log('getAllProducts', filters);

    const cacheKey = `products:list:${JSON.stringify(filters)}`;
    const cachedData = await this.redis.get(cacheKey);
    if (cachedData) {
      this.logger.log(`Cache hit for key: ${cacheKey}`);
      try {
        return JSON.parse(cachedData);
      } catch (err) {
        this.logger.error('Failed to parse cached products JSON', err);
      }
    }

    const { page = 1, limit = 10, ...q } = filters;
    const skip = (page - 1) * limit;

    const where: any = {
      ...(q.name && { name: { contains: q.name, mode: 'insensitive' } }),
      ...(q.minPrice !== undefined && { price: { gte: Number(q.minPrice) } }),
      ...(q.maxPrice !== undefined && { price: { lte: Number(q.maxPrice) } }),
      ...(typeof q.availability !== 'undefined' && {
        availability:
          q.availability === true || q.availability === ('true' as any),
      }),
      ...(q.provider && {
        provider: { contains: q.provider, mode: 'insensitive' },
      }),
    };

    const [total, data] = await Promise.all([
      this.prisma.product.count({ where }),
      this.prisma.product.findMany({
        where,
        skip,
        take: Number(limit),
        orderBy: { name: 'asc' },
      }),
    ]);

    const result = {
      page: Number(page),
      limit: Number(limit),
      total,
      totalPages: Math.ceil(total / limit),
      data,
    };

    // Store in cache for 60 seconds (short TTL)
    await this.redis.set(cacheKey, JSON.stringify(result), 60);

    return result;
  }

  // ── GET /products/:id ──────────────────────────────────────────────────────

  async getProductById(id: number) {
    const product = await this.prisma.product.findUnique({
      where: { id },
      include: { history: { orderBy: { timestamp: 'desc' } } },
    });
    if (!product) throw new NotFoundException(`Product #${id} not found`);
    return product;
  }

  // ── GET /products/changes ──────────────────────────────────────────────────
  //
  // Returns price AND availability changes within the requested timeframe.

  async getProductChanges(filters: GetProductChangesDto) {
    this.logger.log('getProductChanges', filters);

    const { page = 1, limit = 10, startDate, endDate } = filters;
    const skip = (page - 1) * limit;

    const where: any = {
      ...(startDate && { timestamp: { gte: new Date(startDate) } }),
      ...(endDate && { timestamp: { lte: new Date(endDate) } }),
    };

    const [total, changes] = await Promise.all([
      this.prisma.priceHistory.count({ where }),
      this.prisma.priceHistory.findMany({
        where,
        include: { Product: true },
        orderBy: { timestamp: 'desc' },
        skip,
        take: Number(limit),
      }),
    ]);

    return {
      page: Number(page),
      limit: Number(limit),
      total,
      totalPages: Math.ceil(total / limit),
      data: changes.map((c) => ({
        productId: c.Product?.id,
        name: c.Product?.name ?? 'Unknown',
        oldPrice: c.price,
        currentPrice: c.Product?.price ?? 0,
        availabilityChanged: c.availabilityChanged,
        timestamp: c.timestamp,
      })),
    };
  }

  // ── SSE: GET /products/live-changes ───────────────────────────────────────
  //
  // Returns the Subject as an Observable so the controller can pipe it to SSE.
  // External callers (e.g. AggregationService) push events via emitChange().

  emitChange(event: ProductChangeEvent) {
    this.productChanges$.next(event);
  }

  async getLatestChanges(): Promise<ProductChangeEvent[]> {
    const rows = await this.prisma.priceHistory.findMany({
      take: 10,
      orderBy: { timestamp: 'desc' },
      include: { Product: true },
    });
    return rows.map((r) => ({
      id: r.Product?.id ?? 0,
      name: r.Product?.name ?? 'Unknown',
      oldPrice: r.price,
      newPrice: r.Product?.price ?? 0,
      timestamp: r.timestamp,
    }));
  }

  // ── Price update (used by simulate-change route) ───────────────────────────

  async updateProductPrice(productId: number, newPrice: number) {
    const existing = await this.prisma.product.findUnique({
      where: { id: productId },
    });
    if (!existing)
      throw new NotFoundException(`Product #${productId} not found`);
    if (existing.price === newPrice) return existing;

    const updated = await this.prisma.$transaction(async (tx) => {
      await tx.priceHistory.create({
        data: {
          productId: existing.id,
          price: existing.price,
          availabilityChanged: false,
        },
      });
      const updatedProduct = await tx.product.update({
        where: { id: productId },
        data: { price: newPrice },
      });

      // Push to SSE stream
      this.emitChange({
        id: productId,
        name: existing.name,
        oldPrice: existing.price,
        newPrice,
        timestamp: new Date(),
      });

      return updatedProduct;
    });

    await this.redis.deletePattern('products:list:*');
    return updated;
  }
}
