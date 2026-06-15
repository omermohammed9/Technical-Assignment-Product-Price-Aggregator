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
    PrometheusModule.register({
      path: '/metrics',
      defaultMetrics: {
        enabled: true,
      },
    }),
  ],
  providers: [
    MetricsService,
    makeCounterProvider({
      name: 'cache_operations_total',
      help: 'Total number of Redis cache hits and misses',
      labelNames: ['type'],
    }),
    makeHistogramProvider({
      name: 'aggregation_cycle_duration_seconds',
      help: 'Time spent executing the aggregation cycle in seconds',
      buckets: [0.1, 0.5, 1, 2, 5, 10, 30, 60],
    }),
    makeCounterProvider({
      name: 'aggregation_cycle_status_total',
      help: 'Total number of aggregation cycles grouped by status',
      labelNames: ['status'],
    }),
    makeHistogramProvider({
      name: 'provider_fetch_duration_seconds',
      help: 'Time spent fetching data from individual providers in seconds',
      labelNames: ['provider'],
      buckets: [0.1, 0.5, 1, 2, 5, 10],
    }),
    makeCounterProvider({
      name: 'provider_fetch_status_total',
      help: 'Total number of individual provider fetches grouped by status',
      labelNames: ['provider', 'status'],
    }),
  ],
  exports: [MetricsService, PrometheusModule],
})
export class ObservabilityModule {}
