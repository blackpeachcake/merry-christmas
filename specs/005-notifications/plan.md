# 005 — plan (기술·구조)

## 모듈/파일

```
apps/api/src/
└─ notifications/
   ├─ notifications.module.ts
   ├─ notifications.controller.ts  # GET /notifications, PATCH /:id/read (JwtAuthGuard)
   └─ notifications.service.ts     # listMine(userId) · markRead(userId, id)
```

## 로직

- `NotificationsService.listMine(userId)`: `notification` where userId, `orderBy createdAt desc`.
- `NotificationsService.markRead(userId, id)`:
  1. 조회(id) — 없거나 `userId` 불일치 → `NotFoundException`(존재 비노출)
  2. 이미 `readAt` 있으면 그대로 반환(idempotent)
  3. `readAt = new Date()` update

## 공유 타입 (@nacho/shared)

이미 존재(`notification.ts`) — 변경 불필요.

## 테스트 전략 (TDD)

- 통합(real DB): `listMine`(내 것만, 최신순), `markRead`(정상/남의 알림 404/이미 읽음 idempotent).
- 컨트롤러(mock service): 라우팅 위임(userId, id 전달).
