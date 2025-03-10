import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { SchedulerRegistry } from '@nestjs/schedule';
import { PrismaService } from '../modules/prisma/prisma.service';
import { ProvidersService } from '../providers/providers.service';
import * as dotenv from 'dotenv';

dotenv.config();
@Injectable()
export class AggregationService implements OnModuleInit {
  private readonly logger = new Logger(AggregationService.name);
  private isRunning = false;
  private readonly fetchInterval: number;

  constructor(
    private readonly prisma: PrismaService,
    private readonly providersService: ProvidersService,
    private readonly schedulerRegistry: SchedulerRegistry,
  ) {
    this.fetchInterval = Number(process.env.DATA_FETCH_INTERVAL) || 300000; // Default 5 minutes
  }

  /**
   * Initializes aggregation job on application start.
   */
  onModuleInit() {
    this.logger.log(
      `Configuring aggregation job every ${this.fetchInterval / 1000} seconds`,
    );
    this.scheduleAggregation();
  }

  /**
   * Dynamically schedules aggregation based on the configured interval.
   */
  private scheduleAggregation() {
    setInterval(async () => {
      await this.handleAggregation();
    }, this.fetchInterval);
  }

  /**
   * Ensures only one aggregation runs at a time.
   */
  private async handleAggregation() {
    if (this.isRunning) {
      this.logger.warn('Skipping aggregation: Previous job still running.');
      return;
    }

    try {
      this.isRunning = true;
      this.logger.log('Starting periodic data aggregation...');
      await this.aggregateData();
      this.logger.log('Data aggregation completed.');
    } catch (error) {
      this.logger.error(`Aggregation failed: ${error.message}`);
    } finally {
      this.isRunning = false;
    }
  }

  /**
   * Fetch, normalize, and store product data.
   */
  async aggregateData() {
    try {
      this.logger.log('Fetching data from providers...');

      // Fetch provider data concurrently with retry logic
      const [provider1Data, provider2Data, provider3Data] =
        await Promise.allSettled([
          this.fetchWithRetries(() => this.providersService.fetchProvider1()),
          this.fetchWithRetries(() => this.providersService.fetchProvider2()),
          this.fetchWithRetries(() => this.providersService.fetchProvider3()),
        ]);

      // Convert Settled Promises to Valid Data
      const products = [
        ...(provider1Data.status === 'fulfilled'
          ? (provider1Data.value ?? [])
          : []),
        ...(provider2Data.status === 'fulfilled'
          ? (provider2Data.value ?? [])
          : []),
        ...(provider3Data.status === 'fulfilled'
          ? (provider3Data.value ?? [])
          : []),
      ];

      if (!products.length) {
        this.logger.warn('No valid product data received.');
        return;
      }

      // Normalize product data
      const aggregatedData = this.normalizeProducts(products);
      if (!aggregatedData.length) {
        this.logger.warn('No valid products after normalization.');
        return;
      }

      this.logger.debug(
        `Normalized Products: ${JSON.stringify(aggregatedData, null, 2)}`,
      );

      // Upsert product data
      await this.upsertProducts(aggregatedData);
      this.logger.log(
        `Successfully aggregated ${aggregatedData.length} products.`,
      );
    } catch (error) {
      this.logger.error(`Aggregation failed: ${error.message}`);
    }
  }

  /**
   * Fetch data with retry logic.
   */
  private async fetchWithRetries<T>(
    fetchFn: () => Promise<T>,
    retries = 3,
    delay = 1000,
  ): Promise<T | []> {
    for (let attempt = 0; attempt < retries; attempt++) {
      try {
        return await fetchFn();
      } catch (error) {
        this.logger.warn(`Attempt ${attempt + 1} failed: Retrying...`);
        if (attempt === retries - 1) {
          this.logger.error('Final attempt failed:', error);
          return [];
        }
        await new Promise((resolve) =>
          setTimeout(resolve, delay * (attempt + 1)),
        );
      }
    }
  }

  /**
   * Normalize product data before storage.
   */
  private normalizeProducts(products: any[]): any[] {
    return products
      .filter((p) => p.id) // Remove invalid products
      .map((product) => ({
        id: product.id,
        name: product.name ?? 'Unknown',
        description: product.description ?? 'No description',
        price: product.price ?? 0,
        currency: product.currency ?? 'USD',
        availability: product.availability ?? false,
        provider: product.provider ?? 'Unknown',
        lastUpdated: product.lastUpdated
          ? new Date(product.lastUpdated)
          : new Date(),
        lastFetched: new Date(),
      }));
  }

  /**
   * Store product & price history in the database.
   */
  private async upsertProducts(aggregatedData: any[]) {
    // Fetch existing product data first
    const existingProducts = await this.prisma.product.findMany({
      where: { id: { in: aggregatedData.map((p) => p.id) } },
      select: { id: true, price: true },
    });

    const priceHistoryInserts: any[] = [];

    // Identify price changes
    for (const existingProduct of existingProducts) {
      const newProduct = aggregatedData.find(
        (p) => p.id === existingProduct.id,
      );
      if (newProduct && newProduct.price !== existingProduct.price) {
        priceHistoryInserts.push({
          productId: existingProduct.id,
          price: existingProduct.price, // Store old price
        });
      }
    }

    // Perform database transaction
    await this.prisma.$transaction(async (tx) => {
      if (priceHistoryInserts.length > 0) {
        await tx.priceHistory.createMany({ data: priceHistoryInserts });
      }

      for (const product of aggregatedData) {
        await tx.product.upsert({
          where: { id: product.id },
          update: {
            name: product.name,
            description: product.description,
            price: product.price,
            currency: product.currency,
            availability: product.availability,
            provider: product.provider,
            lastUpdated: product.lastUpdated,
            lastFetched: product.lastFetched,
          },
          create: { ...product },
        });
      }
    });
  }
}
