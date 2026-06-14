import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { SchedulerRegistry } from '@nestjs/schedule';
import { PrismaService } from '../modules/prisma/prisma.service';
import { ProvidersService } from '../providers/providers.service';
import { RedisService } from '../modules/redis/redis.service';

/** Stale threshold: products not refreshed within this window are marked stale (ms) */
const STALE_THRESHOLD_MS = 2 * 60 * 60 * 1000; // 2 hours default

@Injectable()
export class AggregationService implements OnModuleInit {
  private readonly logger = new Logger(AggregationService.name);
  private isRunning = false;
  private readonly fetchInterval: number;

  constructor(
    private readonly prisma: PrismaService,
    private readonly providersService: ProvidersService,
    private readonly schedulerRegistry: SchedulerRegistry,
    private readonly redis: RedisService,
  ) {
    this.fetchInterval = Number(process.env.DATA_FETCH_INTERVAL) || 300_000;
  }

  onModuleInit() {
    this.logger.log(
      `Aggregation scheduled every ${this.fetchInterval / 1000}s`,
    );
    // Run an initial fetch immediately on startup
    void this.handleAggregation();
    this.scheduleAggregation();
  }

  // ── Scheduling ─────────────────────────────────────────────────────────────

  private scheduleAggregation() {
    const interval = setInterval(async () => {
      await this.handleAggregation();
    }, this.fetchInterval);

    // Register with NestJS so it can be inspected/cancelled via SchedulerRegistry
    this.schedulerRegistry.addInterval('price-aggregation', interval);
  }

  private async handleAggregation() {
    if (this.isRunning) {
      this.logger.warn('Skipping: previous aggregation still running.');
      return;
    }
    try {
      this.isRunning = true;
      this.logger.log('Starting data aggregation...');
      await this.aggregateData();
      await this.markStaleProducts();
      await this.redis.deletePattern('products:list:*');
      this.logger.log('Aggregation cycle complete.');
    } catch (error) {
      this.logger.error(`Aggregation failed: ${(error as Error).message}`);
    } finally {
      this.isRunning = false;
    }
  }

  // ── Public entry point (used by tests) ────────────────────────────────────

  async aggregateData() {
    const [r1, r2, r3] = await Promise.allSettled([
      this.fetchWithRetries(() => this.providersService.fetchProvider1()),
      this.fetchWithRetries(() => this.providersService.fetchProvider2()),
      this.fetchWithRetries(() => this.providersService.fetchProvider3()),
    ]);

    const raw = [
      ...(r1.status === 'fulfilled' ? (r1.value ?? []) : []),
      ...(r2.status === 'fulfilled' ? (r2.value ?? []) : []),
      ...(r3.status === 'fulfilled' ? (r3.value ?? []) : []),
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

  private normalizeProducts(products: any[]): any[] {
    return products
      .filter((p) => p.id !== undefined && p.id !== null)
      .map((p) => ({
        id: Number(p.id),
        name: p.name ?? p.productName ?? p.title ?? 'Unknown',
        description:
          p.description ?? p.summary ?? p.details ?? 'No description',
        price: Number(p.price ?? p.cost ?? p.listPrice ?? 0),
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

  private async upsertProducts(data: any[]) {
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

      if (priceChanged || availChanged) {
        historyInserts.push({
          productId: prev.id,
          price: prev.price, // store OLD price
          availabilityChanged: availChanged,
        });
      }
    }

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
