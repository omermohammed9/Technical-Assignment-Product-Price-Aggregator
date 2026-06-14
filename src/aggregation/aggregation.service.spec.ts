import { Test, TestingModule } from '@nestjs/testing';
import { AggregationService } from './aggregation.service';
import { PrismaService } from '../modules/prisma/prisma.service';
import { ProvidersService } from '../providers/providers.service';
import { SchedulerRegistry } from '@nestjs/schedule';
import { RedisService } from '../modules/redis/redis.service';

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

const mockSchedulerRegistry = {
  addInterval: jest.fn(),
};

const mockRedisService = {
  get: jest.fn().mockResolvedValue(null),
  set: jest.fn().mockResolvedValue(undefined),
  del: jest.fn().mockResolvedValue(undefined),
  deletePattern: jest.fn().mockResolvedValue(undefined),
};

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
};

describe('AggregationService', () => {
  let service: AggregationService;

  beforeEach(async () => {
    jest.clearAllMocks();
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AggregationService,
        { provide: PrismaService, useValue: mockPrismaService },
        { provide: ProvidersService, useValue: mockProvidersService },
        { provide: SchedulerRegistry, useValue: mockSchedulerRegistry },
        { provide: RedisService, useValue: mockRedisService },
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
    // Provider 1 + Provider 3 data → upsert called
    expect(mockPrismaService.product.upsert).toHaveBeenCalled();
  });

  it('should register the interval with SchedulerRegistry on init', () => {
    service.onModuleInit();
    expect(mockSchedulerRegistry.addInterval).toHaveBeenCalledWith(
      'price-aggregation',
      expect.any(Object),
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
