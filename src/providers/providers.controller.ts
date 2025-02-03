import { Controller, Get } from '@nestjs/common';
import { ProvidersService } from './providers.service';

@Controller('mock-providers')
export class ProvidersController {
  constructor(private readonly providersService: ProvidersService) {}

  @Get('provider1')
  async getProvider1() {
    return await this.providersService.fetchProvider1();
  }

  @Get('provider2')
  async getProvider2() {
    return await this.providersService.fetchProvider2();
  }
}
