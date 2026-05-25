# @kasifraza/nestjs-health

[![npm version](https://img.shields.io/npm/v/@kasifraza/nestjs-health.svg)](https://www.npmjs.com/package/@kasifraza/nestjs-health)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue.svg)](https://www.typescriptlang.org/)

A health check module for NestJS with memory, disk, and ping indicators. Perfect for Kubernetes liveness/readiness probes.

## Installation

```bash
npm install @kasifraza/nestjs-health
```

## Usage

```typescript
import { HealthModule, MemoryHealthIndicator, DiskHealthIndicator, PingHealthIndicator } from '@kasifraza/nestjs-health';

@Module({
  imports: [
    HealthModule.register({
      checks: [
        new MemoryHealthIndicator(),
        new DiskHealthIndicator(),
        new PingHealthIndicator('https://api.example.com'),
      ],
    }),
  ],
})
export class AppModule {}
```

This exposes a `GET /health` endpoint returning:

```json
{
  "status": "up",
  "checks": {
    "memory": { "status": "up" },
    "disk": { "status": "up" },
    "ping": { "status": "up" }
  }
}
```

## Custom Indicators

```typescript
import { HealthIndicator } from '@kasifraza/nestjs-health';

class RedisHealthIndicator extends HealthIndicator {
  name = 'redis';
  async check() {
    // your logic
    return { status: 'up' };
  }
}
```

## License

MIT
