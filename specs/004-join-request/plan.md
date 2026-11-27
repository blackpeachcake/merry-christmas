# 004 — plan (기술·구조)

## 가드 (신규)

- `RoomOwnerGuard` — `req.params.id`(roomId)의 `room.ownerId === req.userId` 확인. `JwtAuthGuard` 뒤에 체이닝. 아니면 403.

## 모듈/파일

```
apps/api/src/
├─ rooms/
│  ├─ rooms.controller.ts     # (기존) + POST /:id/join, GET /:id/requests, POST /:id/requests/:reqId/approve|reject
│  ├─ invite.controller.ts    # GET /invite/:roomId (비로그인)
│  ├─ rooms.service.ts        # (기존) + preview·joinByCode·listPendingRequests·approveRequest·rejectRequest
│  └─ room-owner.guard.ts
└─ models/
   └─ join-room.dto.ts        # JoinRoomDto { code }
```

## 로직 (RoomsService 추가 메서드)

- `preview(roomId)`: room 조회 → `{ name }`, 없으면 `NotFoundException`.
- `joinByCode(userId, roomId, code)`:
  1. room 조회(없으면 404), `code !== room.inviteCode` → 400
  2. 이미 `room_member`면 409
  3. 기존 `join_request` 조회: `status === 'pending'` → 그대로 반환(idempotent) / `rejectCount >= 3` → 403
  4. upsert `join_request`(status=pending, rejectCount 유지) + `notification`(owner, `join_requested`, payload `{roomId, roomName, requesterId}`)
- `listPendingRequests(roomId)`: `join_request` where roomId & status=pending, 신청자 프로필 join(select user).
- `approveRequest(roomId, reqId)`:
  1. `join_request` 조회(roomId+id), 없거나 status≠pending → 400
  2. `room_member` count(roomId) >= `room.capacity` → 400(정원 초과)
  3. 트랜잭션: `room_member` insert(role=member) + `join_request.status=approved`
  4. `notification`(신청자, `join_approved`, `{roomId, roomName}`)
- `rejectRequest(roomId, reqId)`:
  1. `join_request` 조회, status≠pending → 400
  2. `status=rejected`, `rejectCount++`
  3. `notification`(신청자, `join_rejected`, `{roomId, roomName}`)

## DB (Prisma 추가)

```prisma
model JoinRequest {
  id          String   @id @default(uuid())
  roomId      String   @map("room_id")
  userId      String   @map("user_id")
  status      String   // pending | approved | rejected
  rejectCount Int      @default(0) @map("reject_count")
  createdAt   DateTime @default(now()) @map("created_at")
  updatedAt   DateTime @updatedAt @map("updated_at")

  @@unique([roomId, userId])
  @@map("join_requests")
}

model Notification {
  id        String    @id @default(uuid())
  userId    String    @map("user_id")
  type      String    // join_requested | join_approved | join_rejected
  payload   Json
  readAt    DateTime? @map("read_at")
  createdAt DateTime  @default(now()) @map("created_at")

  @@map("notifications")
}
```

## 공유 타입 (@nacho/shared)

이미 존재(`room.ts`의 `JoinRequest`, `notification.ts`의 `Notification`) — 변경 불필요. 응답 DTO는 이 타입 그대로 매핑.

## 테스트 전략 (TDD)

- 단위: `RoomOwnerGuard`(mock req/prisma) — owner면 true, 아니면 403, 방 없으면 404.
- 통합(real DB): `RoomsService.preview`·`joinByCode`(최초 신청/중복 pending/이미 멤버 409/거절 3회 초과 403)·`listPendingRequests`·`approveRequest`(정원 초과 400/정상 승인+member insert+알림)·`rejectRequest`(reject_count 증가+알림).
- 컨트롤러(mock service): 라우팅 위임, roomId/reqId 전달, 가드 통과 확인.
