import { Injectable } from '@nestjs/common';
import { InjectMetric } from '@willsoto/nestjs-prometheus';
import { Counter, Histogram } from 'prom-client';

@Injectable()
export class MetricsService {
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
