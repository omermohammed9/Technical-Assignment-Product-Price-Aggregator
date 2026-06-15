/**
 * @file providers.controller.ts
 * @description Controller exposing raw mock endpoints mirroring simulated third-party APIs.
 * Facilitates isolation testing and verification of the aggregator's normalization rules.
 * @module ProvidersController
 */

import { Controller, Get } from '@nestjs/common';
import { ProvidersService } from './providers.service';

@Controller('mock-providers')
export class ProvidersController {
  /**
   * Creates an instance of ProvidersController.
   * @param {ProvidersService} providersService - Injected third-party provider scraping service
   */
  constructor(private readonly providersService: ProvidersService) {}

  /**
   * Retrieves raw, un-normalized mock product datasets for Provider 1 (iTunes structure).
   * @returns {Promise<any[]>} Raw product collection
   */
  @Get('provider1')
  async getProvider1() {
    return await this.providersService.fetchProvider1();
  }

  /**
   * Retrieves raw, un-normalized mock product datasets for Provider 2 (CoinGecko structure).
   * @returns {Promise<any[]>} Raw variant product collection
   */
  @Get('provider2')
  async getProvider2() {
    return await this.providersService.fetchProvider2();
  }
}
