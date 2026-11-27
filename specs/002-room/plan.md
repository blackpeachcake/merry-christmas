# 002 — plan (기술·구조)

## 인증 가드 (신규 — 보호 라우트용)

- `JwtStrategy`(passport-jwt): `Authorization: Bearer <access>` 검증(`JWT_ACCESS_SECRET`) → `req.user = { userId: payload.sub }`.
- `JwtAuthGuard extends AuthGuard('jwt')`. 미인증 401.
- `@UseGuards(JwtAuthGuard)` + `@Req()`로 userId 추출(또는 커스텀 데코레이터 `@CurrentUser()` 추후).

## 모듈/파일

```
apps/api/src/
├─ auth/
│  ├─ jwt.strategy.ts        # access JWT 검증 → { userId }
│  └─ jwt-auth.guard.ts
├─ rooms/
│  ├─ rooms.module.ts
│  ├─ rooms.controller.ts    # POST /rooms, GET /rooms (JwtAuthGuard)
│  └─ rooms.service.ts       # create(userId, input) · listMine(userId)
├─ common/
│  └─ invite-code.ts         # 8자 base62 생성
└─ models/
   └─ room.dto.ts            # CreateRoomDto (Swagger)
```

## 로직

- `RoomsService.create(userId, { name, thumbnailUrl?, capacity })`:
  - 검증: `name` 1~30자(trim 비어있지 않음), `capacity` 정수 1~8 → 아니면 `BadRequestException`.
  - `inviteCode` = 8자 base62(유니크 충돌 시 재생성 몇 회).
  - **트랜잭션**: `room` 생성 + `room_member`(role=owner) insert.
  - 반환: Room(+capacity).
- `RoomsService.listMine(userId)`: owner이거나 room_member인 방 목록(최신순).

## DB (Prisma 추가)

```prisma
model Room {
  id          String   @id @default(uuid())
  name        String
  thumbnailUrl String? @map("thumbnail_url")
  ownerId     String   @map("owner_id")
  inviteCode  String   @unique @map("invite_code")
  capacity    Int      // 1~8 (방장 포함 총원)
  createdAt   DateTime @default(now()) @map("created_at")
  updatedAt   DateTime @updatedAt @map("updated_at")
  members     RoomMember[]
  @@map("rooms")
}
model RoomMember {
  roomId   String   @map("room_id")
  userId   String   @map("user_id")
  role     String   // owner | member
  joinedAt DateTime @default(now()) @map("joined_at")
  room     Room     @relation(fields: [roomId], references: [id], onDelete: Cascade)
  @@id([roomId, userId])
  @@map("room_members")
}
```

## 공유 타입 (@nacho/shared)

- `Room`에 `capacity: number` 추가.
- `CreateRoomRequest { name: string; thumbnailUrl?: string; capacity: number }`.

## 테스트 전략 (TDD)

- 단위(순수): `invite-code` 생성(길이/charset), `JwtStrategy.validate` 매핑.
- 통합(real DB): RoomsService.create(방+owner멤버 생성·검증 거부·inviteCode), listMine.
- 컨트롤러(mock service + mock req): userId 추출, 생성/목록 위임.
