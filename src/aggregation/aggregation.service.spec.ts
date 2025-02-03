import { Test, TestingModule } from '@nestjs/testing';
import { AggregationService } from './aggregation.service';
import { PrismaService } from '../modules/prisma/prisma.service';
import { ProvidersService } from '../providers/providers.service';

describe('AggregationService', () => {
  let service: AggregationService;

  const mockPrismaService = {
    product: {
      upsert: jest.fn().mockResolvedValue({}),
      findMany: jest.fn().mockResolvedValue([]),
    },
    priceHistory: {
      create: jest.fn().mockResolvedValue({}),
    },
    $transaction: jest
      .fn()
      .mockImplementation((transactions) => Promise.all(transactions)),
  };

  const mockProvidersService = {
    fetchProvider1: jest.fn().mockResolvedValue([
      {
        id: 1,
        name: 'Product A',
        description: 'Test',
        price: 100,
        currency: 'USD',
        availability: true,
        provider: 'Provider 1',
        lastUpdated: new Date().toISOString(),
      },
    ]),
    fetchProvider2: jest.fn().mockRejectedValue(new Error('Provider 2 failed')), // Simulate failure
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AggregationService,
        { provide: PrismaService, useValue: mockPrismaService },
        { provide: ProvidersService, useValue: mockProvidersService },
      ],
    }).compile();

    service = module.get<AggregationService>(AggregationService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should handle provider failures and continue', async () => {
    await expect(service.aggregateData()).resolves.not.toThrow();
  });
});
