# 012 — 알림 실시간 전달 (SSE) (BE)

상태: **구현 완료** · 출처: 세션 중 사용자 요청("알림 sse 먼저 할까?") · 005에서 범위 밖으로 미뤄둔 부분

## 1. 무엇을 / 왜
지금은 알림을 폴링(`GET /api/notifications`)으로만 확인할 수 있다. 가입 신청/승인/거절이 발생하는 즉시 FE가 알 수 있도록 **SSE로 실시간 push**를 추가한다.

## 2. 범위 (이 스펙)
- BE만. `GET /api/notifications/stream` (SSE, Jwt) 엔드포인트 추가.
- `RoomsService`가 알림을 생성하는 3곳(가입 신청/승인/거절)에서 생성 즉시 해당 유저의 스트림으로 이벤트 발행.
- 서버 내부 in-memory pub/sub(프로세스 하나 안에서 발행-구독). DB 스키마 변경 없음.

## 3. 수용 기준 (Acceptance Criteria)
- [x] `GET /api/notifications/stream` — 미인증 401
- [x] 인증된 연결은 `text/event-stream`으로 연결 유지 (바로 끊기지 않음)
- [x] 방장에게 `join_requested` 알림이 생성되면, 그 방장의 스트림에 즉시 이벤트가 옴
- [x] 신청자에게 `join_approved`/`join_rejected` 알림이 생성되면, 그 신청자의 스트림에 즉시 이벤트가 옴
- [x] 나와 관련 없는(다른 유저 대상) 알림 이벤트는 내 스트림에 오지 않음

## 4. 범위 밖 (나중)
- **멀티 인스턴스 환경에서의 전달 보장** — 지금은 in-memory(단일 프로세스) pub/sub이라, Cloud Run이 2개 이상 인스턴스로 스케일아웃되면 알림을 생성한 인스턴스와 SSE로 연결된 인스턴스가 다를 경우 전달되지 않음. 트래픽이 늘어 다중 인스턴스가 상시화되면 Postgres `LISTEN/NOTIFY` 등으로 교체 필요.
- 알림 삭제, 전체 읽음 처리(mark-all) — 005에서 이미 범위 밖으로 명시된 부분, 이번 스펙도 다루지 않음.
- 재연결 시 유실된 알림 재전송(백필) — FE가 연결 직후 `GET /api/notifications`로 목록을 한 번 받아오는 것으로 충분하다고 가정.
