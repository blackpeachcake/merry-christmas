# 004 — 방 초대 & 가입 승인 (BE)

상태: **스펙 리뷰 중** · 출처: [#12 기획](https://github.com/blackpeachcake/nacho/discussions/12) · [#6 BE](https://github.com/blackpeachcake/nacho/discussions/6)

## 1. 무엇을 / 왜

친구가 초대 링크(`invite_code`)로 들어와 **가입을 신청**하면, 방장이 **승인/거절**한다. 거절은 최대 3회까지 재신청 가능. 각 이벤트는 수신자에게 `notification`으로 쌓인다(실시간 전달은 범위 밖).

## 2. 범위 (이 스펙)

- BE만. **미리보기(비로그인) → 가입 신청 → 방장 승인/거절 → 알림 적재**까지.
- 전제: 002(방 생성), 003(인증 세션)의 `JwtAuthGuard` 재사용.
- 범위 밖(다음 스펙): 알림 실시간 전달(SSE), 알림 목록 조회 API, 초대장.

## 3. 수용 기준 (Acceptance Criteria)

- [x] `GET /api/invite/:roomId` (비로그인 허용) — 방이 있으면 `{ name }`만 반환, 없으면 404
- [x] `POST /api/rooms/:id/join { code }` (Jwt)
  - `code`가 방의 `inviteCode`와 다르면 400
  - 이미 **활성 멤버**면 409(또는 명시적 상태로 idempotent 응답)
  - 기존 `join_request.status`가 `pending`이면 그대로 idempotent 응답(중복 신청 방지)
  - `rejectCount >= 3`이면 403(재신청 불가)
  - 그 외: `join_request` upsert(status=pending) + 방장에게 `join_requested` 알림 생성
- [x] `GET /api/rooms/:id/requests` (방장만) — 해당 방의 `pending` 신청 목록(신청자 프로필 포함)
- [x] `POST /api/rooms/:id/requests/:reqId/approve` (방장만)
  - 방이 **정원 초과**면 400
  - `room_member`(role=member) insert + `join_request.status=approved` + 신청자에게 `join_approved` 알림
- [x] `POST /api/rooms/:id/requests/:reqId/reject` (방장만)
  - `join_request.status=rejected` + `reject_count++` + 신청자에게 `join_rejected` 알림
  - 승인/거절 대상이 `pending`이 아니면 400(중복 처리 방지)

## 4. 데이터 모델 (추가)

```
join_request(id, room_id, user_id, status, reject_count, created_at, updated_at) UNIQUE(room_id, user_id)
notification(id, user_id, type, payload jsonb, read_at, created_at)
```

(디스커션 #6 DDL 그대로. `packages/shared`엔 `JoinRequest`/`Notification` 타입 이미 존재 — BE 스키마만 추가)

## 5. 범위 밖 (나중)

알림 실시간(SSE)·목록 조회 API, 초대장(invitation) 생성/편집, 탈퇴 시 방 처리.

## 6. 확정

- 거절 한도: **3회** (`MAX_REJECT_COUNT`, 이미 `@nacho/shared`에 상수 존재)
- 승인 시 정원 체크: `room_member` 수(owner 포함) `>= capacity`면 승인 불가

> plan.md → tasks.md 작성 후 테스트 우선 구현.
