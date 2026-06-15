/**
 * @file products.service.ts
 * @description Service containing the business logic for the digital products catalog.
 * Manages queries (with Redis short-TTL cache wraps), history change listings,
 * and handles price update simulations while pushing change alerts onto the SSE stream.
 * @module ProductsService
 */

import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { Subject } from 'rxjs';
import { PrismaService } from '../modules/prisma/prisma.service';
import { GetProductsDto } from './dto/get-products.dto';
import { GetProductChangesDto } from './dto/get-product-changes.dto';
import { RedisService } from '../modules/redis/redis.service';
import { MetricsService } from '../modules/observability/metrics.service';

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
   * AggregationService and manual simulations push events here.
   */
  readonly productChanges$ = new Subject<ProductChangeEvent>();

  /**
   * Creates an instance of ProductsService.
   *
   * @param {PrismaService} prisma - Injected database client service
   * @param {RedisService} redis - Injected Redis caching client
   * @param {MetricsService} metrics - Injected Prometheus metrics service
   */
  constructor(
    private readonly prisma: PrismaService,
    private readonly redis: RedisService,
    private readonly metrics: MetricsService,
  ) {}

  // ── GET /products ──────────────────────────────────────────────────────────

  /**
   * Queries products from the database using optional filters and pagination.
   * Implements a Redis read-through cache model with a short (60s) TTL.
   *
   * @param {GetProductsDto} filters - Criteria to search by (name, minPrice, maxPrice, availability, provider, page, limit)
   * @returns {Promise<{ page: number, limit: number, total: number, totalPages: number, data: any[] }>} Paginated products collection
   */
  async getAllProducts(filters: GetProductsDto) {
    this.logger.log('getAllProducts', filters);

    // Compute key signature based on query parameters JSON
    const cacheKey = `products:list:${JSON.stringify(filters)}`;
    const cachedData = await this.redis.get(cacheKey);
    if (cachedData) {
      this.logger.log(`Cache hit for key: ${cacheKey}`);
      this.metrics.cacheOperations.inc({ type: 'hit' });
      try {
        return JSON.parse(cachedData);
      } catch (err) {
        this.logger.error('Failed to parse cached products JSON', err);
      }
    } else {
      this.metrics.cacheOperations.inc({ type: 'miss' });
    }

    const { page = 1, limit = 10, ...q } = filters;
    const skip = (page - 1) * limit;

    // Build Prisma filtering conditions dynamically
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

    // Parallelize count query and record retrieval to optimize database response times
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

    // Store in cache for 60 seconds (short TTL) to offload database reads during burst requests
    await this.redis.set(cacheKey, JSON.stringify(result), 60);

    return result;
  }

  // ── GET /products/:id ──────────────────────────────────────────────────────

  /**
   * Fetches a single product details by its unique identifier, including nested change histories.
   *
   * @param {number} id - Product ID
   * @returns {Promise<any>} The product matching the ID
   * @throws {NotFoundException} If no product matches the ID
   */
  async getProductById(id: number) {
    const product = await this.prisma.product.findUnique({
      where: { id },
      include: { history: { orderBy: { timestamp: 'desc' } } },
    });
    if (!product) throw new NotFoundException(`Product #${id} not found`);
    return product;
  }

  // ── GET /products/changes ──────────────────────────────────────────────────

  /**
   * Fetches product changes historical logs filtered by start and end timestamps.
   *
   * @param {GetProductChangesDto} filters - Time boundary parameters and pagination info
   * @returns {Promise<{ page: number, limit: number, total: number, totalPages: number, data: any[] }>} Paginated list of changes
   */
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

  /**
   * Emits a new price change event to the hot RxJS Subject stream to broadcast to connected SSE clients.
   *
   * @param {ProductChangeEvent} event - Event details containing old and new price rates
   */
  emitChange(event: ProductChangeEvent) {
    this.productChanges$.next(event);
  }

  /**
   * Retrieves the 10 most recent price history changes to send as a snapshop payload when a client connects.
   *
   * @returns {Promise<ProductChangeEvent[]>} List of recent change event objects
   */
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

  /**
   * Manually updates a product price and inserts a history event within a transaction block.
   * Broadcasts the update to active SSE clients and purges Redis cache pages.
   *
   * @param {number} productId - Target product ID
   * @param {number} newPrice - Target price value to write
   * @returns {Promise<any>} The updated product record
   * @throws {NotFoundException} If the product does not exist
   */
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

    // Invalidate list caches to ensure client queries receive the updated price immediately
    await this.redis.deletePattern('products:list:*');
    return updated;
  }
}
