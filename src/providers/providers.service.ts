/**
 * @file providers.service.ts
 * @description Integrates with four real-world APIs (Apple App Store, CoinGecko, Binance, and CheapShark)
 * to pull product details, software listings, crypto ticker costs, and pc game deals.
 * Exposes different data layouts for testing schema normalization capabilities in the AggregationService.
 * @module ProvidersService
 */

import { Injectable, Logger } from '@nestjs/common';
import axios from 'axios';

@Injectable()
export class ProvidersService {
  private readonly logger = new Logger(ProvidersService.name);
  private readonly PRICE_VARIATION = 0.1; // ±10% variation (retained for signature consistency)

  /**
   * Generates a stable numeric hash from a string key to simulate unique integer database IDs.
   *
   * @private
   * @param {string} str - The source string key (e.g. coin ID or symbol)
   * @returns {number} A positive 32-bit integer hash value
   */
  private hashCode(str: string): number {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      hash = str.charCodeAt(i) + ((hash << 5) - hash);
    }
    return Math.abs(hash);
  }

  // ── Network API Integrations ────────────────────────────────────────────────

  /**
   * Provider 1 — Integrates with Apple iTunes Search API (Software Entities).
   * Schema mapping matches canonical fields directly: { id, name, description, price, availability, provider }
   *
   * @returns {Promise<any[]>} Extracted products collection
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
      this.logger.error(
        `Failed to fetch from iTunes API: ${(error as Error).message}`,
        (error as Error).stack,
      );
      return [];
    }
  }

  /**
   * Provider 2 — Integrates with CoinGecko Market Markets API.
   * Uses alternate field names: { cost, productName, summary, inStock, updatedAt, vendor }
   *
   * @returns {Promise<any[]>} Extracted variant products collection
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
      this.logger.error(
        `Failed to fetch from CoinGecko: ${(error as Error).message}`,
        (error as Error).stack,
      );
      return [];
    }
  }

  /**
   * Provider 3 — Integrates with Binance Ticker API.
   * Filters for top USDT trading pairs.
   * Uses alternate field names: { listPrice, title, details, isAvailable, timestamp, source }
   *
   * @returns {Promise<any[]>} Extracted variant products collection
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
      this.logger.error(
        `Failed to fetch from Binance: ${(error as Error).message}`,
        (error as Error).stack,
      );
      return [];
    }
  }

  /**
   * Provider 4 — Integrates with CheapShark API (PC Game Deals).
   * Uses alternate field names: { gameName, steamRating, salePrice, isAvailable, source }
   *
   * @returns {Promise<any[]>} Extracted variant products collection
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
      this.logger.error(
        `Failed to fetch from CheapShark: ${(error as Error).message}`,
        (error as Error).stack,
      );
      return [];
    }
  }
}
