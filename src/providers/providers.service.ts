import { Injectable } from '@nestjs/common';

/**
 * Service responsible for simulating external product providers.
 * Generates random price changes and availability dynamically.
 */
@Injectable()
export class ProvidersService {
  private readonly PRICE_VARIATION_PERCENTAGE = 0.1; // ±10% variation
  private readonly PROVIDER_OFFSETS = {
    'Provider 1': 1,
    'Provider 2': 100,
    'Provider 3': 200,
  };

  private provider1Data = [
    {
      id: 1,
      name: 'Product 1',
      description: 'Description for Product 1',
      basePrice: 10.99,
      currency: 'USD',
      availability: true,
      provider: 'Provider 1',
    },
    {
      id: 2,
      name: 'Product 2',
      description: 'Description for Product 2',
      basePrice: 20.99,
      currency: 'USD',
      availability: false,
      provider: 'Provider 1',
    },
  ];

  private provider2Data = [
    {
      id: 3,
      name: 'Product A',
      description: 'Description for Product A',
      basePrice: 15.99,
      currency: 'EUR',
      availability: true,
      provider: 'Provider 2',
    },
    {
      id: 4,
      name: 'Product B',
      description: 'Description for Product B',
      basePrice: 25.99,
      currency: 'EUR',
      availability: true,
      provider: 'Provider 2',
    },
  ];

  private provider3Data = [
    {
      id: 5,
      name: 'Software X',
      description: 'Popular software package',
      basePrice: 49.99,
      currency: 'USD',
      availability: true,
      provider: 'Provider 3',
    },
    {
      id: 6,
      name: 'E-Book Y',
      description: 'Bestselling digital book',
      basePrice: 14.99,
      currency: 'USD',
      availability: true,
      provider: 'Provider 3',
    },
  ];

  /**
   * Simulates a delay to mimic an API call.
   */
  private async simulateNetworkDelay(): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, 1000));
  }

  /**
   * Fetches products from Provider 1 with simulated network delay.
   */
  async fetchProvider1(): Promise<any[]> {
    await this.simulateNetworkDelay();
    return this.mapProviderData(this.provider1Data, 'Provider 1');
  }

  /**
   * Fetches products from Provider 2 with simulated network delay.
   */
  async fetchProvider2(): Promise<any[]> {
    await this.simulateNetworkDelay();
    return this.mapProviderData(this.provider2Data, 'Provider 2');
  }

  /**
   * Fetches products from Provider 3 with simulated network delay.
   */
  async fetchProvider3(): Promise<any[]> {
    await this.simulateNetworkDelay();
    return this.mapProviderData(this.provider3Data, 'Provider 3');
  }
  /**
   * Maps provider data to a standardized format with dynamic price variations.
   * @param data - Array of product objects from a provider.
   * @param providerName - Name of the provider.
   */
  private mapProviderData(data: any[], providerName: string): any[] {
    return data.map((product, index) => ({
      id: product.id ?? this.generateUniqueId(index, providerName),
      name: product.name ?? 'Unknown',
      description: product.description ?? 'No description available',
      price: this.getRandomPrice(product.basePrice),
      currency: product.currency ?? 'USD',
      availability: Math.random() > 0.2, // 80% chance available
      lastUpdated: new Date().toISOString(),
      provider: product.provider ?? providerName,
    }));
  }

  /**
   * Generates a unique product ID based on provider.
   * @param index - Index of the product in the array.
   * @param providerName - Name of the provider.
   * @returns Unique product ID.
   */
  private generateUniqueId(index: number, providerName: string): number {
    return index + (this.PROVIDER_OFFSETS[providerName] || 300); // Default offset for future providers
  }

  /**
   * Generates a random price within ±10% of the base price.
   * @param basePrice - The original price of the product.
   * @returns Adjusted price within 10% range.
   */
  private getRandomPrice(basePrice: number): number {
    const variation = basePrice * this.PRICE_VARIATION_PERCENTAGE; // 10% variation
    return parseFloat(
      (basePrice + (Math.random() * variation - variation / 2)).toFixed(2),
    );
  }
}
