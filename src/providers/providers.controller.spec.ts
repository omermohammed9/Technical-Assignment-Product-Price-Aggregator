import { Test, TestingModule } from '@nestjs/testing';
import { ProvidersController } from './providers.controller';
import { ProvidersService } from './providers.service';

describe('ProvidersController', () => {
  let controller: ProvidersController;

  const mockProvidersService = {
    fetchProvider1: jest.fn().mockResolvedValue([
      {
        id: 1,
        name: 'Test Product',
        description: 'Description',
        price: 10,
        currency: 'USD',
        availability: true,
        lastUpdated: new Date().toISOString(),
        provider: 'Provider 1',
      },
    ]),
    fetchProvider2: jest.fn().mockResolvedValue([
      {
        id: 2,
        name: 'Test Product 2',
        description: 'Description 2',
        price: 20,
        currency: 'EUR',
        availability: false,
        lastUpdated: new Date().toISOString(),
        provider: 'Provider 2',
      },
    ]),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ProvidersController],
      providers: [
        { provide: ProvidersService, useValue: mockProvidersService },
      ],
    }).compile();

    controller = module.get<ProvidersController>(ProvidersController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
