/**
 * @file health.controller.spec.ts
 * @description Unit tests for HealthController.
 * Confirms output shapes for database query ping successes and service exceptions for connection failures.
 */

import { Test, TestingModule } from '@nestjs/testing';
import { HealthController } from './health.controller';
import { PrismaService } from '../modules/prisma/prisma.service';
import { ServiceUnavailableException } from '@nestjs/common';

describe('HealthController', () => {
  let controller: HealthController;
  let prisma: PrismaService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [HealthController],
      providers: [
        {
          provide: PrismaService,
          useValue: {
            // Mock raw SQL query ping command execution returning dummy object
            $queryRaw: jest.fn().mockResolvedValue([{}]),
          },
        },
      ],
    }).compile();

    controller = module.get<HealthController>(HealthController);
    prisma = module.get<PrismaService>(PrismaService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('should return healthy status if DB is connected', async () => {
    const res = await controller.checkHealth();
    expect(res.status).toBe('healthy');
    expect(res.database).toBe('connected');
    expect(res).toHaveProperty('timestamp');
  });

  it('should throw ServiceUnavailableException if DB query fails', async () => {
    // Force database query execution to fail to simulate network/credentials disconnection
    jest
      .spyOn(prisma, '$queryRaw')
      .mockRejectedValueOnce(new Error('DB connection failed'));

    await expect(controller.checkHealth()).rejects.toThrow(
      ServiceUnavailableException,
    );
  });
});
