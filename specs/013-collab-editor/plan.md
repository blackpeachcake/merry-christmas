# 013 — plan

## 접근

`@hocuspocus/server`의 `Hocuspocus` 클래스를 직접 생성해(= `Server.configure`가 아님, 자체 포트로 리스닝하지 않게) Nest의 기존 HTTP 서버(Express)에 `upgrade` 이벤트로 수동 연결한다. 새 의존성: `@hocuspocus/server`, `ws`(업그레이드 수신용), `yjs`(apps/api에는 아직 없음 — apps/web에만 있던 것).

## 변경 파일

1. **`apps/api/src/collab/collab.util.ts` (신규, 순수 함수 — TDD 핵심 대상)**
   - `extractCookie(cookieHeader: string | null, name: string): string | null`
   - `toInvitationId(documentName: string): string` / `toDocumentName(invitationId: string): string` (`invitation:<id>` 포맷)

2. **`apps/api/src/collab/collab.gateway.ts` (신규)**
   - `@Injectable() CollabGateway`: 생성자에 `TokenService`, `InvitationsService`, `PrismaService` 주입
   - `authenticate({ documentName, requestHeaders }): Promise<{ userId: string }>` — 쿠키에서 `access_token` 추출 → `tokens.verifyAccess` → `invitations.assertCanEdit(userId, invitationId)`. 실패 시 throw(Hocuspocus가 연결 거부로 처리)
   - `loadDocument({ documentName, document }): Promise<Document>` — `prisma.invitation.findUnique`로 `yjsState` 읽어 `Y.applyUpdate` 후 `document` 반환
   - `storeDocument({ documentName, document }): Promise<void>` — `Y.encodeStateAsUpdate(document)` → `prisma.invitation.update({ yjsState })`
   - `hocuspocus = new Hocuspocus({ onAuthenticate: ..., onLoadDocument: ..., onStoreDocument: ..., quiet: true })` (각 훅은 위 메서드로 위임 — 유닛 테스트는 메서드를 직접 호출)
   - `wss = new WebSocketServer({ noServer: true })`
   - `handleUpgrade(req, socket, head)`: `wss.handleUpgrade(req, socket, head, (ws) => this.hocuspocus.handleConnection(ws, toWebRequest(req)))`
   - `toWebRequest(req: IncomingMessage): Request` — Node 전역 `Request`/`Headers`로 변환하는 작은 헬퍼(같은 파일 내부)

3. **`apps/api/src/invitations/invitations.service.ts`**
   - `assertMember`를 그대로 두고, 공개 메서드 `assertCanEdit(userId: string, invitationId: string): Promise<void>` 추가(초대장 조회 404 + `assertMember` 호출). 기존 `update()`가 중복하던 조회+멤버체크를 이 메서드로 교체(리팩터).

4. **`apps/api/src/invitations/invitations.module.ts`**
   - `exports: [InvitationsService]` 추가(CollabModule에서 쓰기 위함)

5. **`apps/api/src/collab/collab.module.ts` (신규)**
   - `imports: [AuthModule, InvitationsModule]`, `providers: [CollabGateway, PrismaService]`, `exports: [CollabGateway]`

6. **`apps/api/src/app.module.ts`**
   - `CollabModule` import 추가

7. **`apps/api/src/main.ts`**
   - `app.listen()` 후 `app.getHttpServer()`로 raw http 서버를 얻어 `'upgrade'` 이벤트에서 `req.url`이 `/api/collab`로 시작할 때만 `app.get(CollabGateway).handleUpgrade(req, socket, head)` 호출

8. **`.github/workflows/deploy-api.yml`**
   - `gcloud run deploy` 커맨드에 `--timeout=3600` 추가(기본 300s → WS 장시간 연결 대응)

9. **`apps/api/package.json`**: `@hocuspocus/server`, `ws`, `yjs` 추가. `@types/ws`는 devDependencies.

## 테스트 전략 (TDD)

- `collab.util.spec.ts`: 쿠키 파싱(여러 쿠키/없음/따옴표 없는 값), documentName ↔ invitationId 변환 — 순수 함수라 바로 단위테스트.
- `collab.gateway.spec.ts`: `PrismaService`/`TokenService`/`InvitationsService` 전부 목으로 주입하고 `authenticate`/`loadDocument`/`storeDocument` 세 메서드를 직접 호출해 검증(실제 WebSocket·Hocuspocus 내부 프로토콜은 테스트 대상 아님):
  - 쿠키 없음 → throw
  - 유효하지 않은 토큰 → throw
  - 멤버가 아닌 초대장 → throw (invitations.assertCanEdit이 던지는 걸 그대로 전파)
  - 정상 → `{ userId }` 반환
  - `loadDocument`: `yjsState` 있으면 `Y.applyUpdate` 호출(스파이), 없으면 호출 안 함
  - `storeDocument`: `prisma.invitation.update`가 인코딩된 바이트로 호출되는지
- `invitations.service.spec.ts`: 기존 `update()` 테스트가 깨지지 않는지 + `assertCanEdit` 신규 테스트(존재/멤버 아님/정상) 추가.
- WS 업그레이드·Hocuspocus 프로토콜 자체는 유닛테스트로 검증 어려움 → 로컬에서 `ws` + `@hocuspocus/provider`로 간단한 Node 스크립트를 짜서 두 클라이언트가 붙었을 때 동기화되는지, 쿠키 없이 붙였을 때 거부되는지 수동 확인 후 커밋.

## 검증

tsc, vitest 전체, nest build, 로컬 부팅 후 수동 스크립트로 WS 연결·인증·동기화 확인, `deploy-api.yml` timeout 변경 반영 확인(배포 후 `gcloud run services describe`로 `timeoutSeconds` 3600 확인).
