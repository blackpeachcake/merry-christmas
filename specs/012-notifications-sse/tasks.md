# 012 — tasks

- [x] T1. `NotificationEventsService` TDD 구현 (유닛 테스트: userId 필터링)
- [x] T2. `NotificationsModule`에 등록/export, `NotificationsController`에 `@Sse('stream')` 추가 (+ 컨트롤러 delegation 테스트)
- [x] T3. `RoomsModule`이 `NotificationsModule` import, `RoomsService`에 주입 + 알림 생성 3곳에서 `events.emit` 호출 (+ 기존 rooms 테스트에 emit 검증 추가)
- [x] T4. tsc/vitest(전체 회귀 없음)/빌드/로컬 부팅 + curl로 SSE 수동 확인
- [x] T5. 커밋·푸시 + prod 배포 확인
- [x] T6. 디스커션 #6에 요약 코멘트
