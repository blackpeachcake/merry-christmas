# 008 — plan (기술·구조)

## RoomsService 추가 메서드

- `leave(userId, roomId)`: 방 조회(없으면 404) → `room.ownerId === userId`면 403("방장은 나갈 수 없습니다") → `room_member` 조회(없으면 404) → 삭제.
- `remove(roomId)`: (호출 전 `RoomOwnerGuard`가 존재/방장 여부 확인 끝낸 상태) 트랜잭션으로 `invitation`→`joinRequest`→`roomMember`→`room` 순서 삭제. 007의 `UsersService.remove`와 동일 패턴(JoinRequest/Invitation은 relation이 아니라 수동 삭제 필요).

## RoomsController 추가 라우트

```
POST   /rooms/:id/leave   — Jwt만 (방장 구분은 서비스에서)
DELETE /rooms/:id         — Jwt + RoomOwnerGuard
```

## 테스트 전략 (TDD)

- 통합(real DB): `leave`(정상/방장 403/비멤버 404), `remove`(방+invitation+joinRequest+roomMember 전부 삭제 확인).
- 컨트롤러(mock service): 라우팅 위임.
