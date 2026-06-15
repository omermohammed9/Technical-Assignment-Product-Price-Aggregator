/**
 * @file observability.module.ts
 * @description Global NestJS module registering the Prometheus metrics exposition context.
 * Declares custom counters and histograms, registers the HTTP `/metrics` scrape endpoint,
 * and exports MetricsService to handle instrumentation tracking.
 * @module ObservabilityModule
 */

import { Global, Module } from '@nestjs/common';
import {
  PrometheusModule,
  makeCounterProvider,
  makeHistogramProvider,
} from '@willsoto/nestjs-prometheus';
import { MetricsService } from './metrics.service';

@Global()
@Module({
  imports: [
    // Configure Prometheus to expose standard and default runtime metrics (GC, memory usage, CPU) at /metrics
    PrometheusModule.register({
      path: '/metrics',
      defaultMetrics: {
        enabled: true,
      },
    }),
  ],
  providers: [
    MetricsService,
    // Track cache hit/miss count (type = hit | miss)
    makeCounterProvider({
      name: 'cache_operations_total',
      help: 'Total number of Redis cache hits and misses',
      labelNames: ['type'],
    }),
    // Track execution latency of aggregation cycles
    makeHistogramProvider({
      name: 'aggregation_cycle_duration_seconds',
      help: 'Time spent executing the aggregation cycle in seconds',
      buckets: [0.1, 0.5, 1, 2, 5, 10, 30, 60],
    }),
    // Track total completed cycles (status = success | failure)
    makeCounterProvider({
      name: 'aggregation_cycle_status_total',
      help: 'Total number of aggregation cycles grouped by status',
      labelNames: ['status'],
    }),
    // Track fetch request latency for individual remote providers
    makeHistogramProvider({
      name: 'provider_fetch_duration_seconds',
      help: 'Time spent fetching data from individual providers in seconds',
      labelNames: ['provider'],
      buckets: [0.1, 0.5, 1, 2, 5, 10],
    }),
    // Track total fetches for providers (provider = provider-x, status = success | failure)
    makeCounterProvider({
      name: 'provider_fetch_status_total',
      help: 'Total number of individual provider fetches grouped by status',
      labelNames: ['provider', 'status'],
    }),
  ],
  exports: [MetricsService, PrometheusModule],
})
export class ObservabilityModule {}
