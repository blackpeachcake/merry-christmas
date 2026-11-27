# 004 — tasks (TDD)

- [x] T1. Prisma `JoinRequest`·`Notification` 모델 추가 + 로컬 마이그레이션(`prisma db push`)
- [x] T2. `RoomOwnerGuard` (mock prisma/req) — owner 통과, 아니면 403, 방 없으면 404
- [x] T3. `RoomsService.preview(roomId)` (real DB) — 이름만 반환, 없으면 404
- [x] T4. `RoomsService.joinByCode` (real DB) — 최초 신청/코드불일치 400/이미멤버 409/중복pending idempotent/거절3회 403
- [x] T5. `RoomsService.listPendingRequests` (real DB) — pending만, 신청자 프로필 포함
- [x] T6. `RoomsService.approveRequest` (real DB) — 정원초과 400/정상 승인(member insert+상태변경+알림)
- [x] T7. `RoomsService.rejectRequest` (real DB) — 상태변경+reject_count++ +알림, 중복처리 400
- [x] T8. `InviteController`(GET /invite/:roomId) + `RoomsController` 라우트 4개 추가(mock service 테스트) + `JoinRoomDto`
- [x] T9. 모듈 연결(`RoomsModule`) + 빌드/부팅 확인
- [x] T10. prod 마이그레이션 + 배포
