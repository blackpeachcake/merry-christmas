import { describe, it, expect } from 'vitest';
import { NotificationEventsService } from './notification-events.service';

describe('NotificationEventsService', () => {
  it('delivers an emitted event only to a matching userId subscriber', () => {
    const events = new NotificationEventsService();
    const received: unknown[] = [];
    const sub = events.streamFor('a').subscribe((e) => received.push(e));

    events.emit('a', { id: 'n1', userId: 'a', type: 'join_requested', payload: {}, createdAt: '' } as any);
    events.emit('b', { id: 'n2', userId: 'b', type: 'join_requested', payload: {}, createdAt: '' } as any);

    sub.unsubscribe();
    expect(received).toHaveLength(1);
    expect((received[0] as any).data.id).toBe('n1');
  });
});
