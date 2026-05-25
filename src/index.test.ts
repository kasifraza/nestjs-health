import { MemoryHealthIndicator, DiskHealthIndicator, HealthController, HealthModuleOptions, HealthIndicator, HealthModule } from './index';

class MockUpIndicator extends HealthIndicator {
  name = 'mock-up';
  async check() { return { status: 'up' as const }; }
}

class MockDownIndicator extends HealthIndicator {
  name = 'mock-down';
  async check() { return { status: 'down' as const, message: 'service unavailable' }; }
}

describe('MemoryHealthIndicator', () => {
  it('should return up when heap is below threshold', async () => {
    const indicator = new MemoryHealthIndicator(1024 * 1024 * 1024);
    const result = await indicator.check();
    expect(result.status).toBe('up');
  });

  it('should return down when heap exceeds threshold', async () => {
    const indicator = new MemoryHealthIndicator(1); // 1 byte threshold
    const result = await indicator.check();
    expect(result.status).toBe('down');
  });
});

describe('DiskHealthIndicator', () => {
  it('should return a valid status', async () => {
    const indicator = new DiskHealthIndicator(99);
    const result = await indicator.check();
    expect(['up', 'down']).toContain(result.status);
  });
});

describe('HealthController', () => {
  it('should return up when all checks pass', async () => {
    const options: HealthModuleOptions = { checks: [new MockUpIndicator()] };
    const controller = new HealthController(options);
    const result = await controller.check();
    expect(result.status).toBe('up');
    expect(result.checks['mock-up'].status).toBe('up');
  });

  it('should return down when any check fails', async () => {
    const options: HealthModuleOptions = { checks: [new MockUpIndicator(), new MockDownIndicator()] };
    const controller = new HealthController(options);
    const result = await controller.check();
    expect(result.status).toBe('down');
    expect(result.checks['mock-down'].message).toBe('service unavailable');
  });
});

describe('HealthModule', () => {
  it('should return a dynamic module from register()', () => {
    const mod = HealthModule.register({ checks: [] });
    expect(mod.module).toBe(HealthModule);
    expect(mod.controllers).toContain(HealthController);
    expect(mod.providers).toHaveLength(1);
  });
});
