# 🎄 merry-christmas — 친구랑 만드는 나만의 초대장

소셜 로그인 → 방 만들기 → 친구 초대(방장 승인) → 방 안에서 초대장 여러 개를 **실시간 동시 편집** → 이미지로 저장.
설계 논의는 [GitHub Discussions](https://github.com/blackpeachcake/nacho/discussions) 참고 (#4 기능, #6 BE, #7 인프라, #8 구조).

## 모노레포 구조

```
nacho/
├─ apps/
│  ├─ web/          # FE — Next.js 16 (App Router), Dockerfile 포함
│  └─ api/          # BE — NestJS + Prisma (auth, rooms, invitations, collab(Yjs/WS), uploads 등)
├─ packages/
│  └─ shared/       # FE/BE 공유 TypeScript 타입
├─ docker-compose.yml  # 로컬 dev DB(Postgres)
├─ .github/         # CI(PR 검사), BE 배포(Cloud Run), PR 자동 담당자·리뷰어 지정, PR 템플릿
├─ lefthook.yml     # Git 훅 (prettier·eslint / commitlint / typecheck·test)
└─ tsconfig.base.json
```

## 시작하기

```bash
nvm use            # Node 22
corepack enable    # pnpm (package.json의 packageManager 버전)
pnpm install       # lefthook 훅도 자동 설치

docker compose up -d                      # 로컬 DB (Postgres, localhost:5433)
cp apps/api/.env.example apps/api/.env    # DB/JWT/카카오/Cloudinary 값 채우기
pnpm --filter api exec prisma db push
pnpm dev:api                              # http://localhost:3000

cp apps/web/.env.example apps/web/.env    # NEXT_PUBLIC_API_URL 등
pnpm dev:web                              # http://localhost:5173
```

카카오 로그인 등 BE 연동까지 테스트하려면 `apps/api/.env`의 `KAKAO_REST_API_KEY` / `KAKAO_CLIENT_SECRET`을 BE 담당자에게 받아 채워야 한다. FE 화면 작업만 할 때는 비워둬도 된다.

휴대폰에서 FE 개발 서버 열기: `DEV_ALLOWED_ORIGINS=<PC의 IP> pnpm dev:web` 후 `http://<PC의 IP>:5173`.

## 스크립트

| 명령                                         | 내용                                        |
| -------------------------------------------- | ------------------------------------------- |
| `pnpm dev:web` / `pnpm dev:api`              | 웹(5173) / API(3000) 개발 서버              |
| `pnpm build:web`                             | 웹 프로덕션 빌드                            |
| `pnpm lint` · `pnpm typecheck` · `pnpm test` | 전체 워크스페이스 검사                      |
| `pnpm format` · `pnpm format:check`          | Prettier                                    |
| `pnpm --filter web test:e2e`                 | Playwright E2E (Pixel 7 / iPhone 15 뷰포트) |
| `pnpm --filter api db:push` / `db:migrate`   | Prisma 스키마 반영 / 마이그레이션           |

## 배포

- **FE**: `docker build -f apps/web/Dockerfile --build-arg NEXT_PUBLIC_API_URL=... .` (컨텍스트는 루트)
- **BE**: `.github/workflows/deploy-api.yml` — main 푸시 시 Cloud Run(`nacho-api`, asia-northeast3)으로 자동 배포

인프라 설계는 [#7 인프라 설계 디스커션](https://github.com/blackpeachcake/nacho/discussions/7) 참고.
