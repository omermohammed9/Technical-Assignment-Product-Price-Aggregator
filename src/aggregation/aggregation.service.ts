/**
 * @file aggregation.service.ts
 * @description Background data aggregator service acting as a BullMQ queue worker.
 * Concurrently queries multiple external APIs, normalizes custom vendor data formats into a canonical database schema,
 * writes price history changes transactionally, handles network request retries with exponential backoff,
 * flags stale products, and invalidates list caches.
 * @module AggregationService
 */

import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { InjectQueue, Processor, WorkerHost } from '@nestjs/bullmq';
import { Queue, Job } from 'bullmq';
import { PrismaService } from '../modules/prisma/prisma.service';
import { ProvidersService } from '../providers/providers.service';
import { RedisService } from '../modules/redis/redis.service';
import { MetricsService } from '../modules/observability/metrics.service';

/** Stale threshold: products not refreshed within this window are marked stale (ms) */
const STALE_THRESHOLD_MS = 2 * 60 * 60 * 1000; // 2 hours default

@Processor('aggregation')
@Injectable()
export class AggregationService extends WorkerHost implements OnModuleInit {
  private readonly logger = new Logger(AggregationService.name);
  private readonly fetchInterval: number;

  /**
   * Creates an instance of AggregationService.
   *
   * @param {Queue} aggregationQueue - Injected BullMQ queue instance
   * @param {PrismaService} prisma - Injected database client service
   * @param {ProvidersService} providersService - Injected third-party provider scraper service
   * @param {RedisService} redis - Injected Redis caching client
   * @param {MetricsService} metrics - Injected Prometheus metrics service
   */
  constructor(
    @InjectQueue('aggregation') private readonly aggregationQueue: Queue,
    private readonly prisma: PrismaService,
    private readonly providersService: ProvidersService,
    private readonly redis: RedisService,
    private readonly metrics: MetricsService,
  ) {
    super();
    this.fetchInterval = Number(process.env.DATA_FETCH_INTERVAL) || 300_000;
  }

  /**
   * Initializes module lifecycle.
   * Schedules a repeatable BullMQ job based on DATA_FETCH_INTERVAL and triggers an immediate aggregation cycle.
   */
  async onModuleInit() {
    this.logger.log(
      `Aggregation scheduled every ${this.fetchInterval / 1000}s via BullMQ`,
    );

    // Remove any existing repeatable jobs to avoid scheduling duplicates on application hot-reload
    const existingRepeatables = await this.aggregationQueue.getRepeatableJobs();
    for (const job of existingRepeatables) {
      await this.aggregationQueue.removeRepeatableByKey(job.key);
    }

    // Add a repeatable job executing periodically
    await this.aggregationQueue.add(
      'aggregation-cycle',
      {},
      {
        repeat: { every: this.fetchInterval },
        removeOnComplete: { count: 10 },
        removeOnFail: { count: 50 },
      },
    );

    // Run an initial fetch immediately on startup to seed the database catalog
    await this.aggregationQueue.add(
      'aggregation-cycle',
      {},
      {
        removeOnComplete: { count: 10 },
        removeOnFail: { count: 50 },
      },
    );
  }

  // ── BullMQ Worker Process ─────────────────────────────────────────────────

  /**
   * Primary entry point invoked by BullMQ worker thread when a new job arrives in the queue.
   * Coordinates data aggregation, stale product scanning, and cache invalidation.
   *
   * @param {Job} job - Inbound BullMQ job parameters
   * @returns {Promise<void>}
   */
  async process(job: Job): Promise<void> {
    this.logger.log(`Processing BullMQ job: ${job.name} (id: ${job.id})`);
    const cycleEnd = this.metrics.aggregationCycleDuration.startTimer();

    try {
      await this.aggregateData();
      await this.markStaleProducts();
      // Invalidate all product lists keys in Redis cache to ensure fresh updates are returned
      await this.redis.deletePattern('products:list:*');
      this.metrics.aggregationCycleStatus.inc({ status: 'success' });
      this.logger.log('Aggregation cycle complete.');
    } catch (error) {
      this.metrics.aggregationCycleStatus.inc({ status: 'failure' });
      this.logger.error(`Aggregation failed: ${(error as Error).message}`);
      throw error; // Let BullMQ handle retries based on queue configuration
    } finally {
      cycleEnd();
    }
  }

  // ── Public entry point (used by tests) ────────────────────────────────────

  /**
   * Concurrently pulls raw product catalogs from multiple external APIs, normalizes, and upserts them.
   * Tracks fetch times and successes/failures via Prometheus gauge metrics.
   *
   * @returns {Promise<void>}
   */
  async aggregateData() {
    const fetchProvider = async (
      name: string,
      fetchFn: () => Promise<unknown[]>,
    ) => {
      const end = this.metrics.providerFetchDuration.startTimer({
        provider: name,
      });
      try {
        const result = await this.fetchWithRetries(fetchFn);
        this.metrics.providerFetchStatus.inc({
          provider: name,
          status: 'success',
        });
        return result;
      } catch (err) {
        this.metrics.providerFetchStatus.inc({
          provider: name,
          status: 'failure',
        });
        throw err;
      } finally {
        end();
      }
    };

    // Concurrently fetch from Apple Store, CoinGecko, Binance, and CheapShark
    const [r1, r2, r3, r4] = await Promise.allSettled([
      fetchProvider('provider-1', () => this.providersService.fetchProvider1()),
      fetchProvider('provider-2', () => this.providersService.fetchProvider2()),
      fetchProvider('provider-3', () => this.providersService.fetchProvider3()),
      fetchProvider('provider-4', () => this.providersService.fetchProvider4()),
    ]);

    // Merge successfully completed results
    const raw = [
      ...(r1.status === 'fulfilled' ? (r1.value ?? []) : []),
      ...(r2.status === 'fulfilled' ? (r2.value ?? []) : []),
      ...(r3.status === 'fulfilled' ? (r3.value ?? []) : []),
      ...(r4.status === 'fulfilled' ? (r4.value ?? []) : []),
    ];

    if (!raw.length) {
      this.logger.warn('No product data received from any provider.');
      return;
    }

    const normalized = this.normalizeProducts(raw);
    if (!normalized.length) {
      this.logger.warn('No valid products after normalization.');
      return;
    }

    await this.upsertProducts(normalized);
    this.logger.log(`Aggregated ${normalized.length} products.`);
  }

  // ── Retry logic ────────────────────────────────────────────────────────────

  /**
   * Retries an asynchronous operation with exponential backoff delay.
   *
   * @private
   * @template T
   * @param {() => Promise<T>} fetchFn - The API request promise function
   * @param {number} [retries=3] - Maximum retry attempts permitted
   * @param {number} [baseDelay=1000] - Initial backoff delay in milliseconds
   * @returns {Promise<T | []>} The resolved results, or an empty array if all attempts fail
   */
  private async fetchWithRetries<T>(
    fetchFn: () => Promise<T>,
    retries = 3,
    baseDelay = 1000,
  ): Promise<T | []> {
    for (let attempt = 0; attempt < retries; attempt++) {
      try {
        return await fetchFn();
      } catch (err) {
        this.logger.warn(
          `Attempt ${attempt + 1}/${retries} failed: ${(err as Error).message}`,
        );
        if (attempt === retries - 1) {
          this.logger.error('All retry attempts exhausted.', err);
          return [];
        }
        // Exponential backoff: 1s, 2s, 4s …
        await new Promise((r) =>
          setTimeout(r, baseDelay * Math.pow(2, attempt)),
        );
      }
    }
    return [];
  }

  // ── Normalization ──────────────────────────────────────────────────────────
  //
  // Each provider uses different field names. This function maps all shapes
  // into a single canonical format before storage.
  //
  //   Provider 1 (canonical):  name, description, price, availability, lastUpdated, provider
  //   Provider 2 (variant):    productName, summary, cost, inStock, updatedAt, vendor
  //   Provider 3 (variant):    title, details, listPrice, isAvailable, timestamp, source

  /**
   * Normalizes heterogeneous vendor product shapes into standard canonical database formats.
   *
   * @private
   * @param {any[]} products - Collection of raw provider product objects
   * @returns {any[]} Catalog of normalized product entities ready for database write
   */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private normalizeProducts(products: any[]): any[] {
    return products
      .filter((p) => p.id !== undefined && p.id !== null)
      .map((p) => ({
        id: Number(p.id),
        name: p.name ?? p.productName ?? p.title ?? p.gameName ?? 'Unknown',
        description:
          p.description ??
          p.summary ??
          p.details ??
          p.steamRating ??
          'No description',
        price: Number(p.price ?? p.cost ?? p.listPrice ?? p.salePrice ?? 0),
        currency: p.currency ?? 'USD',
        availability: Boolean(
          p.availability ?? p.inStock ?? p.isAvailable ?? false,
        ),
        provider: p.provider ?? p.vendor ?? p.source ?? 'Unknown',
        lastUpdated: new Date(
          p.lastUpdated ?? p.updatedAt ?? p.timestamp ?? new Date(),
        ),
        lastFetched: new Date(),
      }));
  }

  // ── Upsert with price/availability history ─────────────────────────────────

  /**
   * Performs high-integrity database writes for products.
   * Compares incoming parameters with existing values to generate price and availability history logs
   * and commits both operations in a single atomic transaction.
   *
   * @private
   * @param {any[]} data - Normalized product objects
   * @returns {Promise<void>}
   */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private async upsertProducts(data: any[]) {
    // Query database for current records to determine changes
    const existing = await this.prisma.product.findMany({
      where: { id: { in: data.map((p) => p.id) } },
      select: { id: true, price: true, availability: true },
    });

    const existingMap = new Map(existing.map((e) => [e.id, e]));
    const historyInserts: {
      productId: number;
      price: number;
      availabilityChanged: boolean;
    }[] = [];

    for (const newProd of data) {
      const prev = existingMap.get(newProd.id);
      if (!prev) continue;

      const priceChanged = prev.price !== newProd.price;
      const availChanged = prev.availability !== newProd.availability;

      // Log to history if price or availability status changed since the last fetch cycle
      if (priceChanged || availChanged) {
        historyInserts.push({
          productId: prev.id,
          price: prev.price, // store OLD price for chronological trend analysis
          availabilityChanged: availChanged,
        });
      }
    }

    // Execute history recording and product records upserting within a single transaction boundary
    await this.prisma.$transaction(async (tx) => {
      if (historyInserts.length > 0) {
        await tx.priceHistory.createMany({ data: historyInserts });
      }

      for (const p of data) {
        await tx.product.upsert({
          where: { id: p.id },
          update: {
            name: p.name,
            description: p.description,
            price: p.price,
            currency: p.currency,
            availability: p.availability,
            provider: p.provider,
            lastUpdated: p.lastUpdated,
            lastFetched: p.lastFetched,
            isStale: false, // freshly fetched — mark as fresh
          },
          create: { ...p, isStale: false },
        });
      }
    });
  }

  // ── Stale detection ────────────────────────────────────────────────────────
  //
  // Products whose lastFetched is older than STALE_THRESHOLD_MS are flagged.

  /**
   * Scans database to detect products not updated by recent data aggregation cycles.
   * Flags these records as stale to prevent displaying outdated cache inventories.
   *
   * @returns {Promise<void>}
   */
  async markStaleProducts() {
    const threshold = new Date(Date.now() - STALE_THRESHOLD_MS);
    const result = await this.prisma.product.updateMany({
      where: { lastFetched: { lt: threshold }, isStale: false },
      data: { isStale: true },
    });
    if (result.count > 0) {
      this.logger.warn(`Marked ${result.count} product(s) as stale.`);
    }
  }
}
