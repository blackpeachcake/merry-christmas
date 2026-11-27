# 008 — 방 나가기 · 방 삭제 (BE)

상태: **구현 완료** · 출처: [#12 기획](https://github.com/blackpeachcake/nacho/discussions/12#discussioncomment-19861439) · [#6 BE 설계](https://github.com/blackpeachcake/nacho/discussions/6)

## 1. 무엇을 / 왜

방 멤버가 방을 자발적으로 **나가기**, 방장이 방 자체를 **삭제**(방장 메뉴 — #12 [4]). 둘 다 지금까지 빠져 있던 기능.

## 2. 범위 (이 스펙)

- BE만. `POST /api/rooms/:id/leave`(멤버 나가기), `DELETE /api/rooms/:id`(방 삭제, 방장만).
- 전제: 002(방), 004(room_member).
- 범위 밖(다음 스펙): 멤버 강퇴(방장이 타인을 내보내기), 방장 위임/소유권 이전.

## 3. 수용 기준 (Acceptance Criteria)

- [x] `POST /api/rooms/:id/leave` (Jwt)
  - 멤버면 `room_member` 삭제, 200
  - **방장은 나갈 수 없음**(방 삭제를 써야 함) — 403
  - 멤버가 아니면 404
- [x] `DELETE /api/rooms/:id` (Jwt, 방장만 — `RoomOwnerGuard` 재사용)
  - 방 + 그 방의 `invitation`·`join_request`·`room_member` 전부 삭제, 200
  - 방장 아니면 403(가드가 처리), 방 없으면 404(가드가 처리)

## 4. 범위 밖 (나중)

멤버 강퇴, 방장 위임/소유권 이전.

> plan.md → tasks.md 작성 후 테스트 우선 구현.
