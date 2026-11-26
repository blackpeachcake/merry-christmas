# 012 — plan

## 접근
in-memory pub/sub. 새 의존성 없음 — `rxjs`(이미 apps/api 의존성)의 `Subject`로 발행/구독, Nest `@Sse()` 데코레이터로 Observable을 SSE로 변환.

## 변경 파일

1. **`apps/api/src/notifications/notification-events.service.ts` (신규)**
   - `NotificationEventsService`: `Subject<{ userId: string; notification: Notification }>` 보유
   - `emit(userId: string, notification: Notification): void`
   - `streamFor(userId: string): Observable<MessageEvent>` — `userId` 필터링 후 `{ data: notification }` 형태로 매핑
   - ponytail 주석: in-memory, 멀티 인스턴스에서 전달 안 됨 (spec.md 범위 밖과 동일 내용)

2. **`apps/api/src/notifications/notifications.module.ts`**
   - `NotificationEventsService`를 providers + exports에 추가

3. **`apps/api/src/notifications/notifications.controller.ts`**
   - 생성자에 `NotificationEventsService` 주입
   - `@Sse('stream')` 핸들러 추가 — `req.userId`로 `events.streamFor()` 위임 (기존 `@UseGuards(JwtAuthGuard)`가 컨트롤러 레벨에 이미 있어 그대로 재사용)

4. **`apps/api/src/rooms/rooms.module.ts`**
   - `NotificationsModule` import 추가 (`NotificationEventsService` 쓰기 위함)

5. **`apps/api/src/rooms/rooms.service.ts`**
   - 생성자에 `NotificationEventsService` 주입
   - `joinByCode`/`approveRequest`/`rejectRequest`에서 `prisma.notification.create(...)` 호출 결과(생성된 레코드)를 변수로 받아 `this.events.emit(notification.userId, notification)` 호출 추가

## 테스트 전략 (TDD)
- `notification-events.service.spec.ts` (신규, 순수 유닛): `streamFor('a')`를 구독한 상태에서 `emit('a', ...)`는 수신, `emit('b', ...)`는 수신 안 됨을 검증.
- `rooms.service.spec.ts` / `join-requests.service.spec.ts`: `new RoomsService(prisma, events)`로 변경, `events`는 `{ emit: vi.fn() }` 목. 가입신청/승인/거절 각 테스트에 `expect(events.emit).toHaveBeenCalledWith('owner'|'friend', expect.objectContaining({ type: '...' }))` 추가.
- `notifications.controller.spec.ts`: `stream()`이 `events.streamFor(req.userId)`에 위임하는지 검증(기존 delegation 테스트 패턴과 동일).
- SSE 자체(실제 HTTP 커넥션 유지/`text/event-stream` 헤더)는 유닛테스트로 검증하기 애매한 영역 — 로컬에서 `curl -N`으로 수동 확인 후 커밋.

## 검증
tsc, vitest 전체, nest build, 로컬 부팅 후 `curl -N http://localhost:3000/api/notifications/stream`로 401(미인증) 및 인증 시 연결 유지 확인.
