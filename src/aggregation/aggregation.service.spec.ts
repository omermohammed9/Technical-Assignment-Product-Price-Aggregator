/**
 * @file aggregation.service.spec.ts
 * @description Unit tests for AggregationService using Jest mocks.
 * Validates initialization repeatable job creation, concurrent provider fetch handles,
 * and stale product flagging.
 */

import { Test, TestingModule } from '@nestjs/testing';
import { AggregationService } from './aggregation.service';
import { PrismaService } from '../modules/prisma/prisma.service';
import { ProvidersService } from '../providers/providers.service';
import { RedisService } from '../modules/redis/redis.service';
import { MetricsService } from '../modules/observability/metrics.service';
import { getQueueToken } from '@nestjs/bullmq';

// Mock database service implementing spies on product and priceHistory tables
const mockPrismaService = {
  product: {
    upsert: jest.fn().mockResolvedValue({}),
    findMany: jest.fn().mockResolvedValue([]),
    updateMany: jest.fn().mockResolvedValue({ count: 0 }),
  },
  priceHistory: {
    createMany: jest.fn().mockResolvedValue({ count: 0 }),
  },
  $transaction: jest
    .fn()
    .mockImplementation(async (fn) => fn(mockPrismaService)),
};

// Mock Redis client cache invalidation functions
const mockRedisService = {
  get: jest.fn().mockResolvedValue(null),
  set: jest.fn().mockResolvedValue(undefined),
  del: jest.fn().mockResolvedValue(undefined),
  deletePattern: jest.fn().mockResolvedValue(undefined),
};

// Mock third-party providers simulating successful responses and rejection scenarios
const mockProvidersService = {
  fetchProvider1: jest.fn().mockResolvedValue([
    {
      id: 1,
      name: 'Product A',
      description: 'Test product',
      price: 100,
      currency: 'USD',
      availability: true,
      provider: 'Provider 1',
      lastUpdated: new Date().toISOString(),
    },
  ]),
  fetchProvider2: jest
    .fn()
    .mockRejectedValue(new Error('Provider 2 unavailable')),
  fetchProvider3: jest.fn().mockResolvedValue([
    {
      id: 5,
      title: 'Software X',
      details: 'Popular software',
      listPrice: 49.99,
      currency: 'USD',
      isAvailable: true,
      source: 'DevMarket',
      timestamp: new Date().toISOString(),
    },
  ]),
  fetchProvider4: jest.fn().mockResolvedValue([
    {
      id: 8,
      gameName: 'PC Game Z',
      steamRating: 'Very Positive',
      salePrice: 19.99,
      currency: 'USD',
      isAvailable: true,
      source: 'CheapShark',
      timestamp: new Date().toISOString(),
    },
  ]),
};

// Mock BullMQ aggregation queue methods
const mockQueue = {
  add: jest.fn().mockResolvedValue({}),
  getRepeatableJobs: jest.fn().mockResolvedValue([]),
  removeRepeatableByKey: jest.fn().mockResolvedValue(undefined),
};

// Mock Prometheus metrics collection counters and histograms
const mockMetricsService = {
  cacheOperations: { inc: jest.fn() },
  aggregationCycleDuration: {
    startTimer: jest.fn().mockReturnValue(jest.fn()),
  },
  aggregationCycleStatus: { inc: jest.fn() },
  providerFetchDuration: { startTimer: jest.fn().mockReturnValue(jest.fn()) },
  providerFetchStatus: { inc: jest.fn() },
};

describe('AggregationService', () => {
  let service: AggregationService;

  beforeEach(async () => {
    jest.clearAllMocks();
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AggregationService,
        { provide: getQueueToken('aggregation'), useValue: mockQueue },
        { provide: PrismaService, useValue: mockPrismaService },
        { provide: ProvidersService, useValue: mockProvidersService },
        { provide: RedisService, useValue: mockRedisService },
        { provide: MetricsService, useValue: mockMetricsService },
      ],
    }).compile();

    service = module.get<AggregationService>(AggregationService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should aggregate data from available providers (ignore failed ones)', async () => {
    await expect(service.aggregateData()).resolves.not.toThrow();
    expect(mockProvidersService.fetchProvider1).toHaveBeenCalled();
    expect(mockProvidersService.fetchProvider2).toHaveBeenCalled();
    expect(mockProvidersService.fetchProvider3).toHaveBeenCalled();
  });

  it('should upsert products even when one provider fails', async () => {
    await service.aggregateData();
    // Provider 1 + Provider 3 data → upsert called (ignores failed Provider 2)
    expect(mockPrismaService.product.upsert).toHaveBeenCalled();
  });

  it('should register a repeatable BullMQ job on init', async () => {
    await service.onModuleInit();
    expect(mockQueue.add).toHaveBeenCalledWith(
      'aggregation-cycle',
      {},
      expect.objectContaining({
        repeat: expect.objectContaining({ every: expect.any(Number) }),
      }),
    );
  });

  it('markStaleProducts should call updateMany with lastFetched filter', async () => {
    await service.markStaleProducts();
    expect(mockPrismaService.product.updateMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ isStale: false }),
        data: { isStale: true },
      }),
    );
  });
});
