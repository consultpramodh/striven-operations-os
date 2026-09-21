export interface ApiRequestMetric {
  at: string;
  method: "GET" | "POST";
  path: string;
  status: number;
  durationMs: number;
  attempt: number;
  retryAfterSeconds: number | undefined;
}

export class ApiMeter {
  private readonly metrics: ApiRequestMetric[] = [];

  record(metric: ApiRequestMetric): void {
    this.metrics.push(metric);
  }

  snapshot(): readonly ApiRequestMetric[] {
    return [...this.metrics];
  }

  summary(): {
    totalCalls: number;
    byMethod: Record<string, number>;
    byStatus: Record<string, number>;
  } {
    const byMethod: Record<string, number> = {};
    const byStatus: Record<string, number> = {};

    for (const metric of this.metrics) {
      byMethod[metric.method] = (byMethod[metric.method] ?? 0) + 1;
      const status = String(metric.status);
      byStatus[status] = (byStatus[status] ?? 0) + 1;
    }

    return {
      totalCalls: this.metrics.length,
      byMethod,
      byStatus,
    };
  }
}
