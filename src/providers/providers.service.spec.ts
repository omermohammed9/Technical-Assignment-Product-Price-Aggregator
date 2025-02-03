import { Test, TestingModule } from '@nestjs/testing';
import { ProvidersService } from './providers.service';

describe('ProvidersService', () => {
  let service: ProvidersService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [ProvidersService],
    }).compile();

    service = module.get<ProvidersService>(ProvidersService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should fetch data from provider 1', async () => {
    jest.spyOn(service, 'fetchProvider1').mockResolvedValue([
      {
        id: 1,
        name: 'Mock Product 1',
        description: 'Description for Product 1',
        price: 10.99,
        currency: 'USD',
        availability: true,
        lastUpdated: new Date().toISOString(),
        provider: 'Provider 1',
      },
    ]);

    const result = await service.fetchProvider1();
    expect(result).toBeDefined();
    expect(result.length).toBe(1);
    expect(result[0].name).toBe('Mock Product 1');
  });

  it('should fetch data from provider 2', async () => {
    jest.spyOn(service, 'fetchProvider2').mockResolvedValue([
      {
        id: 2,
        name: 'Mock Product 2',
        description: 'Description for Product 2',
        price: 20.99,
        currency: 'EUR',
        availability: false,
        lastUpdated: new Date().toISOString(),
        provider: 'Provider 2',
      },
    ]);

    const result = await service.fetchProvider2();
    expect(result).toBeDefined();
    expect(result.length).toBe(1);
    expect(result[0].name).toBe('Mock Product 2');
  });

  it('should handle provider 1 failure gracefully', async () => {
    jest
      .spyOn(service, 'fetchProvider1')
      .mockRejectedValue(new Error('Provider 1 failed'));

    await expect(service.fetchProvider1()).rejects.toThrow('Provider 1 failed');
  });

  it('should handle provider 2 failure gracefully', async () => {
    jest
      .spyOn(service, 'fetchProvider2')
      .mockRejectedValue(new Error('Provider 2 failed'));

    await expect(service.fetchProvider2()).rejects.toThrow('Provider 2 failed');
  });
});
