/**
 * @file metrics.service.ts
 * @description Service containing injected Prometheus metrics counters and histograms.
 * Acts as the centralized registry for logging application metrics (cache hit rates, BullMQ jobs, provider fetch latencies).
 * @module MetricsService
 */

import { Injectable } from '@nestjs/common';
import { InjectMetric } from '@willsoto/nestjs-prometheus';
import { Counter, Histogram } from 'prom-client';

@Injectable()
export class MetricsService {
  /**
   * Creates an instance of MetricsService.
   *
   * @param {Counter<string>} cacheOperations - Counts total Redis cache operations labeled by hit/miss status
   * @param {Histogram<string>} aggregationCycleDuration - Measures total time in seconds spent in the background aggregation cycles
   * @param {Counter<string>} aggregationCycleStatus - Counts total executed cycles labeled by success/failure status
   * @param {Histogram<string>} providerFetchDuration - Measures time in seconds spent requesting individual remote provider APIs
   * @param {Counter<string>} providerFetchStatus - Counts fetch attempts labeled by provider name and success/failure status
   */
  constructor(
    @InjectMetric('cache_operations_total')
    public readonly cacheOperations: Counter<string>,

    @InjectMetric('aggregation_cycle_duration_seconds')
    public readonly aggregationCycleDuration: Histogram<string>,

    @InjectMetric('aggregation_cycle_status_total')
    public readonly aggregationCycleStatus: Counter<string>,

    @InjectMetric('provider_fetch_duration_seconds')
    public readonly providerFetchDuration: Histogram<string>,

    @InjectMetric('provider_fetch_status_total')
    public readonly providerFetchStatus: Counter<string>,
  ) {}
}
