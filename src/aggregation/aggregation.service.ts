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

  async onModuleInit() {
    this.logger.log(
      `Aggregation scheduled every ${this.fetchInterval / 1000}s via BullMQ`,
    );

    // Remove any existing repeatable jobs and re-register
    const existingRepeatables = await this.aggregationQueue.getRepeatableJobs();
    for (const job of existingRepeatables) {
      await this.aggregationQueue.removeRepeatableByKey(job.key);
    }

    // Add a repeatable job
    await this.aggregationQueue.add(
      'aggregation-cycle',
      {},
      {
        repeat: { every: this.fetchInterval },
        removeOnComplete: { count: 10 },
        removeOnFail: { count: 50 },
      },
    );

    // Run an initial fetch immediately on startup
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

  async process(job: Job): Promise<void> {
    this.logger.log(`Processing BullMQ job: ${job.name} (id: ${job.id})`);
    const cycleEnd = this.metrics.aggregationCycleDuration.startTimer();

    try {
      await this.aggregateData();
      await this.markStaleProducts();
      await this.redis.deletePattern('products:list:*');
      this.metrics.aggregationCycleStatus.inc({ status: 'success' });
      this.logger.log('Aggregation cycle complete.');
    } catch (error) {
      this.metrics.aggregationCycleStatus.inc({ status: 'failure' });
      this.logger.error(`Aggregation failed: ${(error as Error).message}`);
      throw error; // Let BullMQ handle retries
    } finally {
      cycleEnd();
    }
  }

  // ── Public entry point (used by tests) ────────────────────────────────────

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

    const [r1, r2, r3, r4] = await Promise.allSettled([
      fetchProvider('provider-1', () => this.providersService.fetchProvider1()),
      fetchProvider('provider-2', () => this.providersService.fetchProvider2()),
      fetchProvider('provider-3', () => this.providersService.fetchProvider3()),
      fetchProvider('provider-4', () => this.providersService.fetchProvider4()),
    ]);

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

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
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
