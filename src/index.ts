import 'reflect-metadata';
import { Module, Controller, Get, DynamicModule, Inject, Injectable } from '@nestjs/common';
import * as http from 'http';
import * as https from 'https';

export interface HealthCheckResult {
  status: 'up' | 'down';
  checks: Record<string, { status: 'up' | 'down'; message?: string }>;
}

export abstract class HealthIndicator {
  abstract name: string;
  abstract check(): Promise<{ status: 'up' | 'down'; message?: string }>;
}

export interface HealthModuleOptions {
  checks: HealthIndicator[];
  endpoint?: string;
}

export const HEALTH_OPTIONS = Symbol('HEALTH_OPTIONS');

@Controller('health')
export class HealthController {
  constructor(@Inject(HEALTH_OPTIONS) private options: HealthModuleOptions) {}

  @Get()
  async check(): Promise<HealthCheckResult> {
    const checks: HealthCheckResult['checks'] = {};
    let allUp = true;
    for (const indicator of this.options.checks) {
      const result = await indicator.check();
      checks[indicator.name] = result;
      if (result.status === 'down') allUp = false;
    }
    return { status: allUp ? 'up' : 'down', checks };
  }
}

@Module({})
export class HealthModule {
  static register(options: HealthModuleOptions): DynamicModule {
    return {
      module: HealthModule,
      controllers: [HealthController],
      providers: [{ provide: HEALTH_OPTIONS, useValue: options }],
    };
  }
}

export class MemoryHealthIndicator extends HealthIndicator {
  name = 'memory';
  constructor(private thresholdBytes = 512 * 1024 * 1024) { super(); }
  async check() {
    const used = process.memoryUsage().heapUsed;
    return used < this.thresholdBytes
      ? { status: 'up' as const }
      : { status: 'down' as const, message: `Heap ${Math.round(used / 1024 / 1024)}MB exceeds threshold` };
  }
}

export class DiskHealthIndicator extends HealthIndicator {
  name = 'disk';
  constructor(private thresholdPercent = 90) { super(); }
  async check() {
    try {
      const { execSync } = require('child_process');
      const output = execSync("df -k / | tail -1 | awk '{print $5}'").toString().trim().replace('%', '');
      const usage = parseInt(output, 10);
      return usage < this.thresholdPercent
        ? { status: 'up' as const }
        : { status: 'down' as const, message: `Disk usage ${usage}% exceeds threshold` };
    } catch {
      return { status: 'down' as const, message: 'Unable to check disk' };
    }
  }
}

export class PingHealthIndicator extends HealthIndicator {
  name = 'ping';
  constructor(private url = 'https://google.com') { super(); }
  async check() {
    return new Promise<{ status: 'up' | 'down'; message?: string }>((resolve) => {
      const client = this.url.startsWith('https') ? https : http;
      const req = client.get(this.url, (res) => {
        res.resume();
        resolve(res.statusCode && res.statusCode < 500 ? { status: 'up' } : { status: 'down', message: `Status ${res.statusCode}` });
      });
      req.on('error', (e) => resolve({ status: 'down', message: e.message }));
      req.setTimeout(5000, () => { req.destroy(); resolve({ status: 'down', message: 'Timeout' }); });
    });
  }
}
