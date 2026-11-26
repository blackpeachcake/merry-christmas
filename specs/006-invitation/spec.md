# 006 — 초대장(Invitation) 생성·관리 (BE)

상태: **구현 완료** · 출처: [#12 기획](https://github.com/blackpeachcake/nacho/discussions/12) · [#6 BE](https://github.com/blackpeachcake/nacho/discussions/6)

## 1. 무엇을 / 왜
방 멤버가 방 안에 **초대장을 만들고 메타(이름·배경·썸네일)를 관리**한다. 비율은 생성 후 **불변**.

## 2. 범위 (이 스펙)
- BE만. **초대장 생성·목록·메타 수정·삭제**(메타데이터 CRUD)까지.
- 전제: 002(방), 004(room_member)로 멤버십 판단.
- **범위 밖(다음 스펙)**: 실시간 공동편집(Yjs/Hocuspocus `WS /collab`), 블록 내용. 이번 스펙은 `yjs_state` 컬럼만 추가(빈 값)하고 다루지 않음 — FE 에디터 프로토타입과 맞춰 별도 스펙(007)에서 진행.

## 3. 수용 기준 (Acceptance Criteria)
- [x] `POST /api/rooms/:id/invitations` (방 멤버) — `{ name, ratio, background }` → 생성. 방 멤버 아니면 403
- [x] `ratio`는 `'9:16'|'4:5'|'1:1'|'16:9'` 중 하나만 허용, 그 외 400
- [x] `GET /api/rooms/:id/invitations` (방 멤버) — 해당 방의 초대장 목록
- [x] `PATCH /api/invitations/:id` (방 멤버) — `name`·`background`·`thumbnailUrl`만 수정 가능. `ratio` 포함 시 무시(또는 400). 멤버 아니면 403
- [x] `DELETE /api/invitations/:id` (방장만) — 삭제. 방장 아니면 403

## 4. 데이터 모델 (추가)
```
invitation(id, room_id, name, ratio, background jsonb, thumbnail_url, yjs_state bytea NULL, created_at, updated_at)
```
(디스커션 #6 DDL 그대로. `yjs_state`는 컬럼만 추가, 이번 스펙에서 읽기/쓰기 없음)

## 5. 범위 밖 (나중)
실시간 공동편집(`WS /collab`, Hocuspocus), 썸네일 presigned 업로드(Cloudinary), 초대장 단위 멤버/권한(없음 — 방 멤버십으로 충분).

> plan.md → tasks.md 작성 후 테스트 우선 구현.
