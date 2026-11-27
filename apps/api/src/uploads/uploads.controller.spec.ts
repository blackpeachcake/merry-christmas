import { describe, it, expect, vi } from 'vitest';
import { UploadsController } from './uploads.controller';

describe('UploadsController', () => {
  it('sign delegates to UploadsService.sign', async () => {
    const uploads = {
      sign: vi.fn().mockReturnValue({ signature: 's', timestamp: 1, apiKey: 'k', cloudName: 'c' }),
    } as any;
    const ctrl = new UploadsController(uploads);
    const out = ctrl.sign();
    expect(uploads.sign).toHaveBeenCalled();
    expect(out).toEqual({ signature: 's', timestamp: 1, apiKey: 'k', cloudName: 'c' });
  });
});
