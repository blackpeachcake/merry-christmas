# 002 — 방(Room) 만들기 (BE)

상태: **스펙 리뷰 중** · 출처: [#12 기획](https://github.com/blackpeachcake/nacho/discussions/12) · [#6 BE](https://github.com/blackpeachcake/nacho/discussions/6)

## 1. 무엇을 / 왜
로그인한 유저가 **방을 만든다**. 방은 친구와 함께 초대장을 만드는 공유 공간. 만든 사람이 방장(owner)이 되고, 초대 링크용 `invite_code`가 발급된다. 방은 **정원(1~8명)** 을 생성 시 정한다.

## 2. 범위 (이 스펙)
- BE만. **방 생성 + 내 방 목록**까지.
- 전제: **access JWT 인증 가드**(보호 라우트용) — 001에서 토큰 발급만 했고 "검증 가드"는 없어서 여기서 추가.
- 범위 밖(다음 스펙): 가입 신청·승인, 초대장, 멤버 관리, 방 수정/삭제.

## 3. 정원 의미 (확정)
**총원 1~8명 (방장 포함)** — `capacity`는 방장 포함 총 멤버 상한. 방장 + 최대 (capacity-1)명 초대.

## 4. 수용 기준 (Acceptance Criteria)
- [ ] `POST /api/rooms` (인증 필요) — 바디 `{ name, thumbnailUrl?, capacity }` → 방 생성
- [ ] `capacity`는 **1~8 정수**만 허용 (그 외 400)
- [ ] 생성 시: `invite_code`(랜덤, 유니크) 발급, 생성자를 **owner**로 `room_member` 추가
- [ ] 응답: 생성된 방(id, name, thumbnailUrl, inviteCode, capacity, ownerId …)
- [ ] `GET /api/rooms` (인증 필요) — 내가 **owner 또는 member**인 방 목록
- [ ] **인증 가드**: access JWT(Authorization: Bearer) 검증 → `req.userId`. 미인증 401
- [ ] 방 이름 필수(빈값 400)

## 5. 데이터 모델 (추가)
```
room: ... + capacity int (1~8)   // #6 모델에 capacity 추가
room_member: (이미 설계됨) 생성자 owner 행 insert
```

## 6. 범위 밖 (나중)
가입 신청/승인(정원 체크는 그 스펙에서), 초대장, 방 수정·삭제, 멤버 목록 상세.

## 7. 확정
- 정원: 총원 1~8명(방장 포함)
- `invite_code`: **8자 base62** 랜덤·유니크(충돌 시 재생성)
- 방 이름: **1~30자**

> plan.md → tasks.md 작성 후 테스트 우선 구현.
