# 006 — tasks (TDD)

- [x] T1. Prisma `Invitation` 모델 추가 + `db push`/`generate`
- [x] T2. `@nacho/shared`에 `CreateInvitationRequest`/`UpdateInvitationRequest` 타입 추가
- [x] T3. `InvitationsService.create` (real DB) — 정상/비멤버 403/ratio 밖 400
- [x] T4. `InvitationsService.listByRoom` (real DB) — 해당 방만, 비멤버 403
- [x] T5. `InvitationsService.update` (real DB) — 정상/ratio 무시/비멤버 403/없으면 404
- [x] T6. `InvitationsService.remove` (real DB) — 정상/방장아니면 403/없으면 404
- [x] T7. `InvitationsController` + 라우트 4개(mock service 테스트)
- [x] T8. 모듈 연결(`InvitationsModule`) + tsc/vitest/빌드/부팅 확인
- [x] T9. 커밋·푸시 + prod 배포 확인
- [x] T10. 디스커션 #6에 요약 코멘트
