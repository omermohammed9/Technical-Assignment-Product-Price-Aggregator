import { Injectable } from '@nestjs/common';

import axios from 'axios';

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

  private hashCode(str: string): number {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      hash = str.charCodeAt(i) + ((hash << 5) - hash);
    }
    return Math.abs(hash);
  }

  // ── Network simulation ─────────────────────────────────────────────────────
  /**
   * Provider 1 — Real API Integration (Apple iTunes / App Store)
   */
  async fetchProvider1(): Promise<any[]> {
    try {
      const response = await axios.get(
        'https://itunes.apple.com/search?term=developer&entity=software&limit=20',
      );
      return response.data.results.map((item: any) => ({
        id: item.trackId,
        name: item.trackCensoredName,
        description:
          item.description?.substring(0, 100) || 'App Store Software',
        price: item.price || 0,
        currency: item.currency || 'USD',
        availability: true,
        lastUpdated: new Date().toISOString(),
        provider: 'Apple App Store',
      }));
    } catch (error) {
      console.error('Failed to fetch from iTunes API:', error);
      return [];
    }
  }

  /**
   * Provider 2 — different field names: { cost, inStock, vendor }
   * AggregationService normalizes these into the canonical format.
   * Real API: CoinGecko (Crypto Markets)
   */
  async fetchProvider2(): Promise<any[]> {
    try {
      const response = await axios.get(
        'https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&per_page=20',
      );
      return response.data.map((coin: any) => ({
        id: this.hashCode(coin.id),
        productName: coin.name,
        summary: `Crypto Asset: ${coin.symbol.toUpperCase()}`,
        cost: coin.current_price,
        currency: 'USD',
        inStock: true,
        updatedAt: coin.last_updated || new Date().toISOString(),
        vendor: 'CoinGecko',
      }));
    } catch (error) {
      console.error('Failed to fetch from CoinGecko:', error);
      return [];
    }
  }

  /**
   * Provider 3 — different field names: { listPrice, isAvailable, source }
   * AggregationService normalizes these into the canonical format.
   * Real API: Binance (Crypto Tickers)
   */
  async fetchProvider3(): Promise<any[]> {
    try {
      const response = await axios.get(
        'https://api.binance.com/api/v3/ticker/24hr',
      );
      // Filter to USDT pairs and take top 20
      const pairs = response.data
        .filter((t: any) => t.symbol.endsWith('USDT'))
        .slice(0, 20);
      return pairs.map((ticker: any) => ({
        id: this.hashCode(ticker.symbol),
        title: ticker.symbol,
        details: 'Binance Trading Pair',
        listPrice: parseFloat(ticker.lastPrice),
        currency: 'USDT',
        isAvailable: true,
        timestamp: new Date().toISOString(),
        source: 'Binance',
      }));
    } catch (error) {
      console.error('Failed to fetch from Binance:', error);
      return [];
    }
  }

  /**
   * Provider 4 — different field names: { gameName, steamRating, salePrice, isAvailable, source }
   * AggregationService normalizes these into the canonical format.
   * Real API: CheapShark (PC Game Deals)
   */
  async fetchProvider4(): Promise<any[]> {
    try {
      const response = await axios.get(
        'https://www.cheapshark.com/api/1.0/deals?storeID=1&upperPrice=50&pageSize=20',
      );
      return response.data.map((deal: any) => ({
        id: this.hashCode(deal.dealID),
        gameName: deal.title,
        steamRating: `Steam Rating: ${deal.steamRatingText || 'N/A'} (Normal Price: $${deal.normalPrice})`,
        salePrice: parseFloat(deal.salePrice),
        currency: 'USD',
        isAvailable: true,
        timestamp: new Date().toISOString(),
        source: 'CheapShark',
      }));
    } catch (error) {
      console.error('Failed to fetch from CheapShark:', error);
      return [];
    }
  }
}
