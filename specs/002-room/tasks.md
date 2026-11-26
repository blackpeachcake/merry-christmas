# 002 — tasks (TDD 순서)

실패 테스트 → 최소 구현 → 리팩터.

## 준비
- [ ] T1. Prisma `Room`·`RoomMember` 모델 추가 + 로컬 마이그레이션(`prisma db push`)

## 도메인 로직 (TDD)
- [ ] T2. `common/invite-code.ts` — 8자 base62 생성. 테스트: 길이 8, base62 charset, 매번 다름
- [ ] T3. `auth/jwt.strategy.ts` — access payload `{ sub }` → `{ userId }` 매핑. 테스트: validate 매핑
- [ ] T4. `RoomsService.create(userId, input)` (real DB) — 방+owner 멤버 생성, inviteCode 세팅. 테스트: 생성 성공, capacity 0/9 거부, 빈 이름 거부, owner 멤버 행 존재
- [ ] T5. `RoomsService.listMine(userId)` (real DB) — owner/member 방 목록. 테스트: 내 방만, 최신순

## 웹 계층
- [ ] T6. `JwtAuthGuard` + `RoomsController` (POST/GET `/rooms`, JwtAuthGuard, req.userId). 테스트: 서비스 위임, userId 전달 (mock)
- [ ] T7. `CreateRoomDto`(Swagger) + `RoomsModule` + AppModule 연결 + 부팅/빌드

## 공유 & 배포
- [ ] T8. `@nacho/shared`: `Room.capacity`, `CreateRoomRequest`
- [ ] T9. prod 마이그레이션(Cloud SQL Auth Proxy) + 배포

## 범위 밖(다음 스펙)
가입 신청/승인(정원 체크), 초대장, 방 수정·삭제.
