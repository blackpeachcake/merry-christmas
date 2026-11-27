import { describe, it, expect, vi } from 'vitest';
import { NotificationsController } from './notifications.controller';

describe('NotificationsController', () => {
  it('listMine delegates to service with req.userId', async () => {
    const notifications = { listMine: vi.fn().mockResolvedValue([]) } as any;
    const ctrl = new NotificationsController(notifications, {} as any);
    await ctrl.listMine({ userId: 'u1' } as any);
    expect(notifications.listMine).toHaveBeenCalledWith('u1');
  });

  it('markRead delegates to service with userId and notification id', async () => {
    const notifications = { markRead: vi.fn().mockResolvedValue({ id: 'n1' }) } as any;
    const ctrl = new NotificationsController(notifications, {} as any);
    await ctrl.markRead({ userId: 'u1', params: { id: 'n1' } } as any);
    expect(notifications.markRead).toHaveBeenCalledWith('u1', 'n1');
  });

  it('stream delegates to events.streamFor with req.userId', () => {
    const events = { streamFor: vi.fn().mockReturnValue('obs') } as any;
    const ctrl = new NotificationsController({} as any, events);
    const result = ctrl.stream({ userId: 'u1' } as any);
    expect(events.streamFor).toHaveBeenCalledWith('u1');
    expect(result).toBe('obs');
  });
});
