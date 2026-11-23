# merry-christmas

친구들과 실시간으로 함께 만드는 초대장 서비스. 기획·설계는 GitHub Discussions(#4 기능, #6 BE, #7 인프라, #8 구조)를 기준으로 한다.

## 구조

- `apps/web` — FE, Next.js 16 (App Router). **작업 전 `apps/web/AGENTS.md`를 먼저 읽는다** (학습 데이터와 다른 Next.js 버전).
- `apps/api` — BE, NestJS (다른 팀원 담당 — FE 작업 중 BE 코드·API 계약을 임의로 정하지 않는다)
- `packages/shared` — FE/BE 공유 타입

## 명령어 (루트에서 실행)

| 명령                                         | 내용                                                                   |
| -------------------------------------------- | ---------------------------------------------------------------------- |
| `pnpm dev:web`                               | 웹 개발 서버 (휴대폰 접속: `DEV_ALLOWED_ORIGINS=<PC IP> pnpm dev:web`) |
| `pnpm lint` / `pnpm typecheck` / `pnpm test` | 전체 워크스페이스 검사                                                 |
| `pnpm format`                                | Prettier 포맷                                                          |
| `pnpm --filter web test:e2e`                 | Playwright E2E (모바일 뷰포트)                                         |
| `docker build -f apps/web/Dockerfile .`      | 웹 이미지 빌드 (컨텍스트는 루트)                                       |

## 규칙

- 패키지 매니저는 pnpm만 쓴다. Node 22 (`.nvmrc`).
- 커밋 메시지는 Conventional Commits (`feat(web): ...`). lefthook이 commitlint로 검사한다.
- pre-commit에서 Prettier·ESLint 자동 수정, pre-push에서 typecheck·unit test를 돌린다.
