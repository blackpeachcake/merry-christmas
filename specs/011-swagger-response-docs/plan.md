# 011 — plan

## 공유 타입 추가
`packages/shared/src/models/upload.ts` (신규):
```ts
// POST /api/uploads/signature
export interface UploadSignatureResponse {
  signature: string;
  timestamp: number;
  apiKey: string;
  cloudName: string;
}
```
`index.ts`에 `export * from './models/upload'` 추가.

## 응답 DTO 클래스 (기존 요청 DTO와 같은 파일에 추가, 새 파일은 꼭 필요한 것만)
- `user.dto.ts`: `UserDto implements User`
- `room.dto.ts`: `RoomDto implements Room`, `JoinRequestDto implements JoinRequest`, `RoomPreviewDto { name: string }`
- `invitation.dto.ts`: `InvitationDto implements Invitation` (background는 `example`로 실제 형태 제시)
- `notification.dto.ts` (신규): `NotificationDto implements Notification` (payload는 `example`)
- `upload.dto.ts` (신규): `UploadSignatureDto implements UploadSignatureResponse`

## 컨트롤러에 `@ApiOkResponse` 추가 (로직 변경 없음, 데코레이터만)
- `auth.controller.ts`: `me` → `UserDto`
- `me.controller.ts`: `update` → `UserDto`
- `rooms.controller.ts`: `create` → `RoomDto`; `listMine` → `RoomDto[]`; `listRequests` → `JoinRequestDto[]`
- `invite.controller.ts`: `preview` → `RoomPreviewDto`
- `invitations.controller.ts`: `create`/`update` → `InvitationDto`; `listByRoom` → `InvitationDto[]`
- `notifications.controller.ts`: `listMine` → `NotificationDto[]`; `markRead` → `NotificationDto`
- `uploads.controller.ts`: `sign` → `UploadSignatureDto`

## 검증
순수 문서화(분기 없는 데코레이터 추가)라 유닛테스트 대상 로직이 없음. 기존 전체 테스트 스위트가 깨지지 않는지 확인(타입 임포트만 추가되므로 회귀 없어야 함) + `tsc --noEmit` + `nest build` + 부팅 후 `/api/docs-json`을 읽어 각 경로의 `responses.200.content['application/json'].schema`가 `$ref`를 가지는지, 해당 스키마 정의에 `properties`가 채워져 있는지 확인.
