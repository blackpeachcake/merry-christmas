import { describe, it, expect } from 'vitest';
import { createHash } from 'node:crypto';
import { UploadsService } from './uploads.service';

const cfg = { cloudName: 'demo', apiKey: 'key123', apiSecret: 'secret123' };
const make = () => new UploadsService(cfg);

describe('UploadsService.sign', () => {
  it('returns apiKey/cloudName from config and a timestamp near now', () => {
    const before = Math.floor(Date.now() / 1000);
    const out = make().sign();
    expect(out.apiKey).toBe('key123');
    expect(out.cloudName).toBe('demo');
    expect(out.timestamp).toBeGreaterThanOrEqual(before);
    expect(out.timestamp).toBeLessThanOrEqual(before + 2);
  });

  it('signature matches the cloudinary sha1(timestamp=<ts><secret>) rule', () => {
    const out = make().sign();
    const expected = createHash('sha1')
      .update(`timestamp=${out.timestamp}secret123`)
      .digest('hex');
    expect(out.signature).toBe(expected);
  });
});
