# 007 — 회원 탈퇴 (BE)

상태: **구현 완료** · 출처: [#12 기획](https://github.com/blackpeachcake/nacho/discussions/12#discussioncomment-19861533) · [#6 BE 결정](https://github.com/blackpeachcake/nacho/discussions/6#discussioncomment-19861906)

## 1. 무엇을 / 왜
마이페이지 "탈퇴" — 계정과 관련 데이터를 삭제한다. **방장인 방은 방+소속 초대장까지 전부 CASCADE 삭제**(디스커션 #6에서 확정).

## 2. 범위 (이 스펙)
- BE만. `DELETE /api/me` 하나.
- 범위 밖(다음 스펙): 프로필 수정(`PATCH /me`, 마이페이지 닉네임/이미지) — 별도 스펙.

## 3. 수용 기준 (Acceptance Criteria)
- [x] `DELETE /api/me` (Jwt)
  - 내가 **owner인 방**: 방 + 그 방의 `invitation` + `join_request` + `room_member` 전부 삭제
  - 내가 **member로만 있는 방**: 그 방의 `room_member` 행만 삭제(방 자체는 유지)
  - 내가 보낸/받은 `join_request`, `notification` 삭제
  - 마지막으로 `user` 행 삭제
  - 성공 시 인증 쿠키 clear(logout과 동일), 200
  - 미인증 401

## 4. 범위 밖 (나중)
프로필 수정(PATCH /me), soft-delete/탈퇴 유예기간, 탈퇴 사유 수집.

> plan.md → tasks.md 작성 후 테스트 우선 구현.
