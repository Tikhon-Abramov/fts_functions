import { Test, type TestingModule } from '@nestjs/testing';

import { PrismaService } from '../prisma/prisma.service';

import { HealthController } from './health.controller';

describe('HealthController', () => {
  let controller: HealthController;
  let queryRawUnsafe: jest.Mock;

  beforeEach(async () => {
    queryRawUnsafe = jest.fn().mockResolvedValue([{ '1': 1 }]);

    const module: TestingModule = await Test.createTestingModule({
      controllers: [HealthController],
      providers: [
        {
          provide: PrismaService,
          useValue: { $queryRawUnsafe: queryRawUnsafe },
        },
      ],
    }).compile();

    controller = module.get<HealthController>(HealthController);
  });

  afterEach(() => {
    delete process.env['APP_VERSION'];
  });

  describe('check', () => {
    it('returns status ok with version, uptime, db=connected on success', async () => {
      process.env['APP_VERSION'] = '1.2.3';

      const result = await controller.check();

      expect(result.status).toBe('ok');
      expect(result.version).toBe('1.2.3');
      expect(typeof result.uptime).toBe('number');
      expect(result.uptime).toBeGreaterThanOrEqual(0);
      expect(result.db).toBe('connected');
      expect(queryRawUnsafe).toHaveBeenCalledWith('SELECT 1');
    });

    it('falls back to "dev" when APP_VERSION is unset', async () => {
      const result = await controller.check();
      expect(result.version).toBe('dev');
    });

    it('returns db=disconnected when Prisma query throws', async () => {
      queryRawUnsafe.mockRejectedValueOnce(new Error('connection refused'));
      const result = await controller.check();
      expect(result.status).toBe('ok');
      expect(result.db).toBe('disconnected');
    });

    it('returns db=disconnected when DB probe exceeds 1s timeout', async () => {
      queryRawUnsafe.mockImplementationOnce(
        () => new Promise((resolve) => setTimeout(resolve, 5000)),
      );
      const result = await controller.check();
      expect(result.db).toBe('disconnected');
    });
  });
});
