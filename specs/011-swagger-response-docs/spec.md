# 011 — Swagger 응답 스키마/예시 보강 (BE)

상태: **구현 완료** · 출처: 세션 중 사용자 피드백("response 타입이랑 예시가 없는거같애")

## 1. 무엇을 / 왜
지금까지 만든 라우트는 요청 바디(DTO)만 `@ApiProperty`로 선언돼 있고, **응답**은 TS 인터페이스로만 타입돼 있어 런타임에 지워진다. 그 결과 Swagger UI에 응답 스키마/예시가 비어 보인다. 응답도 DTO 클래스로 선언해 Swagger가 스키마+예시를 보여주게 한다.

## 2. 범위 (이 스펙)
- BE만. 순수 문서화(동작 변경 없음) — 기존 서비스/컨트롤러 로직은 그대로.
- 데이터를 반환하는 모든 라우트에 응답 DTO(`@ApiProperty`) + `@ApiOkResponse({ type / isArray })` 추가.
- `health`/`db-health`(단순 리터럴, 변경 거의 없음)는 제외 — 너무 단순해서 DTO 가치 낮음.
- union/opaque 타입(`background`, notification `payload`)은 `example`로 실제 형태를 보여줌.

## 3. 수용 기준 (Acceptance Criteria)
- [x] `GET /api/auth/me`, `PATCH /api/me` → `UserDto` 스키마+예시
- [x] `POST /api/uploads/signature` → `UploadSignatureDto` 스키마+예시 (+ 공유 타입 `UploadSignatureResponse` 추가)
- [x] `POST /api/rooms`, `GET /api/rooms` → `RoomDto`(단건/배열)
- [x] `GET /api/rooms/:id/requests` → `JoinRequestDto[]`
- [x] `GET /api/invite/:roomId` → `RoomPreviewDto`
- [x] `POST/GET/PATCH` 초대장 라우트 → `InvitationDto`(단건/배열), `background` example 포함
- [x] `GET /api/notifications`, `PATCH /api/notifications/:id/read` → `NotificationDto`(단건/배열), `payload` example 포함
- [x] `/api/docs-json`에서 위 스키마들이 `example`/`properties`를 갖는지 확인(자동테스트 대신 build+부팅 후 수동 확인 — 순수 문서화라 분기 없음)

## 4. 범위 밖 (나중)
요청/응답 런타임 검증(`class-validator`, `ClassSerializerInterceptor`) 도입 — 지금은 문서화만.
