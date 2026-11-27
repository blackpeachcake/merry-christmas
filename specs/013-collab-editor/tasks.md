# 013 — tasks

- [x] T1. 의존성 추가(`@hocuspocus/server`, `ws`, `yjs`, `@types/ws`)
- [x] T2. `collab.util.ts` TDD 구현(쿠키 파싱, documentName 변환)
- [x] T3. `InvitationsService.assertCanEdit` TDD 구현 + `update()` 리팩터, 모듈 export 추가
- [x] T4. `CollabGateway`(authenticate/loadDocument/storeDocument) TDD 구현
- [x] T5. `CollabModule` 등록, `main.ts`에 upgrade 라우팅 연결
- [x] T6. `deploy-api.yml`에 `--timeout=3600` 추가
- [x] T7. tsc/vitest/빌드/로컬 부팅 + 수동 WS 스크립트로 인증·거부·동기화 확인
  - 중간에 발견한 버그: `Hocuspocus.handleConnection()`은 `ClientConnection`만 만들고 raw ws의 message/close 이벤트를 자동 연결해주지 않음(라이브러리 내부 `Server` 클래스가 직접 이 둘을 연결해주는 걸 소스에서 확인). `CollabGateway.handleUpgrade`에서 반환값을 버리고 있던 게 원인 — `ws.on('message'/'close', ...)` → `connection.handleMessage/handleClose`로 직접 연결해 해결.
- [ ] T8. 커밋·푸시 + prod 배포 확인(timeoutSeconds 3600 확인 포함)
- [ ] T9. 디스커션 #6에 요약 코멘트(FE 연동 방법 포함: url/`name`/쿠키 기반 인증)
