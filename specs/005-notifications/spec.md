# 005 — 알림 목록 조회·읽음 처리 (BE)

상태: **스펙 리뷰 중** · 출처: [#12 기획](https://github.com/blackpeachcake/nacho/discussions/12) · [#6 BE](https://github.com/blackpeachcake/nacho/discussions/6)

## 1. 무엇을 / 왜

004에서 적재한 `notification`(가입 신청/승인/거절)을 **본인이 조회**하고 **읽음 처리**할 수 있게 한다. 홈 배너용 데이터 소스.

## 2. 범위 (이 스펙)

- BE만. **내 알림 목록 조회 + 읽음 처리**까지.
- 전제: 004의 `notification` 테이블.
- 범위 밖(다음 스펙): 실시간 전달(SSE), 알림 삭제.

## 3. 수용 기준 (Acceptance Criteria)

- [x] `GET /api/notifications` (Jwt) — 내가 수신자인 알림 목록, 최신순
- [x] `PATCH /api/notifications/:id/read` (Jwt)
  - 내 알림이 아니면 404(존재 비노출)
  - 이미 읽음이면 idempotent(그대로 200)
  - 읽음 처리 시 `readAt = now()`

## 4. 범위 밖 (나중)

실시간 전달(SSE), 알림 삭제, 전체 읽음 처리(mark-all).

> plan.md → tasks.md 작성 후 테스트 우선 구현.
