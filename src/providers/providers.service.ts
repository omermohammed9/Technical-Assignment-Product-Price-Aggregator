import { Injectable } from '@nestjs/common';

/**
 * Simulates three structurally different external provider APIs.
 *
 * Provider 1: canonical field names  { price, availability }
 * Provider 2: alternative field names { cost, inStock }       → normalized by AggregationService
 * Provider 3: alternative field names { listPrice, isAvailable } → normalized by AggregationService
 */
@Injectable()
export class ProvidersService {
  private readonly PRICE_VARIATION = 0.1; // ±10%

  // ── Provider 1 data (canonical schema) ────────────────────────────────────
  private readonly provider1Catalog = [
    {
      id: 1,
      name: 'Digital Course: TypeScript Mastery',
      description: 'Complete TypeScript course for backend developers',
      basePrice: 49.99,
      currency: 'USD',
      provider: 'TechLearn',
    },
    {
      id: 2,
      name: 'E-Book: Clean Architecture',
      description: 'Robert C. Martin — architecture patterns',
      basePrice: 14.99,
      currency: 'USD',
      provider: 'TechLearn',
    },
  ];

  // ── Provider 2 data (uses "cost" + "inStock") ──────────────────────────────
  private readonly provider2Catalog = [
    {
      id: 3,
      name: 'Software License: VSCode Pro',
      description: 'Extended IDE license with team features',
      baseCost: 79.99,
      currency: 'EUR',
      vendor: 'SoftwareBazaar',
    },
    {
      id: 4,
      name: 'Digital Course: NestJS Advanced',
      description: 'Microservices, CQRS, and event-sourcing in NestJS',
      baseCost: 59.99,
      currency: 'EUR',
      vendor: 'SoftwareBazaar',
    },
  ];

  // ── Provider 3 data (uses "listPrice" + "isAvailable") ────────────────────
  private readonly provider3Catalog = [
    {
      id: 5,
      name: 'Software License: JetBrains Suite',
      description: 'Annual subscription — all IDEs included',
      baseListPrice: 249.99,
      currency: 'USD',
      source: 'DevMarket',
    },
    {
      id: 6,
      name: 'E-Book: Designing Data-Intensive Applications',
      description: 'Martin Kleppmann — distributed systems bible',
      baseListPrice: 39.99,
      currency: 'USD',
      source: 'DevMarket',
    },
  ];

  // ── Network simulation ─────────────────────────────────────────────────────
  private delay(ms = 1000) {
    return new Promise<void>((resolve) => setTimeout(resolve, ms));
  }

  private randomPrice(base: number): number {
    const delta = base * this.PRICE_VARIATION;
    return parseFloat((base + (Math.random() * delta - delta / 2)).toFixed(2));
  }

  /**
   * Provider 1 — canonical shape: { price, availability }
   */
  async fetchProvider1(): Promise<any[]> {
    await this.delay(800);
    return this.provider1Catalog.map((p) => ({
      id: p.id,
      name: p.name,
      description: p.description,
      price: this.randomPrice(p.basePrice),
      currency: p.currency,
      availability: Math.random() > 0.2,
      lastUpdated: new Date().toISOString(),
      provider: p.provider,
    }));
  }

  /**
   * Provider 2 — different field names: { cost, inStock, vendor }
   * AggregationService normalizes these into the canonical format.
   */
  async fetchProvider2(): Promise<any[]> {
    await this.delay(1200);
    return this.provider2Catalog.map((p) => ({
      id: p.id,
      productName: p.name, // ≠ name
      summary: p.description, // ≠ description
      cost: this.randomPrice(p.baseCost), // ≠ price
      currency: p.currency,
      inStock: Math.random() > 0.3, // ≠ availability
      updatedAt: new Date().toISOString(), // ≠ lastUpdated
      vendor: p.vendor, // ≠ provider
    }));
  }

  /**
   * Provider 3 — different field names: { listPrice, isAvailable, source }
   * AggregationService normalizes these into the canonical format.
   */
  async fetchProvider3(): Promise<any[]> {
    await this.delay(600);
    return this.provider3Catalog.map((p) => ({
      id: p.id,
      title: p.name, // ≠ name
      details: p.description, // ≠ description
      listPrice: this.randomPrice(p.baseListPrice), // ≠ price
      currency: p.currency,
      isAvailable: Math.random() > 0.15, // ≠ availability
      timestamp: new Date().toISOString(), // ≠ lastUpdated
      source: p.source, // ≠ provider
    }));
  }
}
