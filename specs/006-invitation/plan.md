# 006 — plan (기술·구조)

## 인가
별도 가드 없이 **서비스 레이어에서 멤버십/방장 체크**(join-request와 달리 파라미터가 roomId/invitationId로 섞여 있어 가드 하나로 깔끔히 안 됨 — 004의 `RoomOwnerGuard`는 roomId-keyed 라우트에만 재사용 가능, invitation-keyed 라우트는 서비스에서 처리):
- 생성·목록: `room_member`에 내가 있는지 확인 → 아니면 `ForbiddenException`.
- 수정: invitation → roomId 역참조 → `room_member` 확인.
- 삭제: invitation → roomId 역참조 → `room.ownerId === userId` 확인.

## 모듈/파일
```
apps/api/src/
├─ invitations/
│  ├─ invitations.module.ts
│  ├─ invitations.controller.ts   # POST/GET /rooms/:id/invitations, PATCH/DELETE /invitations/:id
│  └─ invitations.service.ts      # create·listByRoom·update·remove
└─ models/
   └─ invitation.dto.ts           # CreateInvitationDto · UpdateInvitationDto
```

## 로직 (InvitationsService)
- `create(userId, roomId, input)`: 멤버십 확인 → `ratio` enum 검증(아니면 400) → `invitation.create`.
- `listByRoom(userId, roomId)`: 멤버십 확인 → `findMany({ where: { roomId } })`.
- `update(userId, invitationId, patch)`: invitation 조회(없으면 404) → 멤버십 확인 → `name`/`background`/`thumbnailUrl`만 반영(ratio는 입력에 있어도 무시).
- `remove(userId, invitationId)`: invitation 조회(없으면 404) → room.ownerId 확인 → `delete`.

## DB (Prisma 추가)
```prisma
model Invitation {
  id           String   @id @default(uuid())
  roomId       String   @map("room_id")
  name         String
  ratio        String   // '9:16'|'4:5'|'1:1'|'16:9' (불변)
  background   Json
  thumbnailUrl String?  @map("thumbnail_url")
  yjsState     Bytes?   @map("yjs_state") // 007에서 사용 — 이번 스펙은 손대지 않음
  createdAt    DateTime @default(now()) @map("created_at")
  updatedAt    DateTime @updatedAt @map("updated_at")

  @@map("invitations")
}
```

## 공유 타입 (@nacho/shared)
`invitation.ts`에 `CreateInvitationRequest { name; ratio: Ratio; background: Background }` · `UpdateInvitationRequest { name?; background?; thumbnailUrl? }` 추가. `Invitation`은 기존 그대로.

## 테스트 전략 (TDD)
- 통합(real DB): `create`(정상/비멤버 403/ratio 밖 400)·`listByRoom`(해당 방만)·`update`(정상/ratio 무시/비멤버 403/없는 초대장 404)·`remove`(정상/방장아니면 403/없으면 404).
- 컨트롤러(mock service): 라우팅 위임.
