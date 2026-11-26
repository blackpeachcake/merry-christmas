import { Injectable, MessageEvent } from '@nestjs/common';
import { Observable, Subject } from 'rxjs';
import { filter, map } from 'rxjs/operators';
import type { Notification } from '@nacho/shared';

interface Event {
  userId: string;
  notification: Notification;
}

// ponytail: in-memory pub/sub — 같은 프로세스 안에서만 전달됨.
// Cloud Run이 2개 이상 인스턴스로 스케일아웃되면 다른 인스턴스로 간 SSE 연결엔 전달 안 됨.
// 트래픽 늘면 Postgres LISTEN/NOTIFY로 교체.
@Injectable()
export class NotificationEventsService {
  private readonly subject = new Subject<Event>();

  emit(userId: string, notification: Notification): void {
    this.subject.next({ userId, notification });
  }

  streamFor(userId: string): Observable<MessageEvent> {
    return this.subject.asObservable().pipe(
      filter((e) => e.userId === userId),
      map((e) => ({ data: e.notification })),
    );
  }
}
