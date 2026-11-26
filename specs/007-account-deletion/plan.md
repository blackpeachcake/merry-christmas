# 007 — plan (기술·구조)

## 왜 트랜잭션 + 수동 삭제인가
`JoinRequest`/`Invitation`의 `roomId`는 Prisma relation이 아니라 평범한 필드(`RoomMember`만 `onDelete: Cascade` 관계 있음) → 방 삭제 시 DB가 자동으로 같이 지워주지 않음. 그래서 순서를 지켜 수동 삭제.

## UsersService.remove(userId)
한 트랜잭션(`prisma.$transaction`):
1. `ownedRoomIds = room.findMany({ where: { ownerId: userId } }).id[]`
2. `invitation.deleteMany({ where: { roomId: { in: ownedRoomIds } } })`
3. `joinRequest.deleteMany({ where: { roomId: { in: ownedRoomIds } } })`
4. `roomMember.deleteMany({ where: { roomId: { in: ownedRoomIds } } })`
5. `room.deleteMany({ where: { id: { in: ownedRoomIds } } })`
6. `roomMember.deleteMany({ where: { userId } })` — 내가 member로만 있는 나머지 방들에서 나만 빠짐
7. `joinRequest.deleteMany({ where: { userId } })` — 내가 신청자인 행(남은 방 대상)
8. `notification.deleteMany({ where: { userId } })`
9. `user.delete({ where: { id: userId } })`

## AuthController
```
@Delete('me')  (경로: /api/me — AuthController가 @Controller('auth')라서 별도 컨트롤러 필요)
```
→ `/me`는 `auth`가 아닌 루트라서 **새 컨트롤러** `me.controller.ts` (`@Controller('me')`, `JwtAuthGuard`) 하나로 처리. `DELETE /api/me` → `users.remove(userId)` → `clearAuthCookies(res)` → 200.

## 테스트 전략 (TDD)
- 통합(real DB): owner인 방이 통째로 삭제되는지, member로만 있던 방은 남고 room_member만 사라지는지, notification/join_request 정리, 마지막 user 행 삭제 확인.
- 컨트롤러(mock service): 라우팅 위임 + 쿠키 clear.
