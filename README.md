# 🎄 merry-christmas — 친구랑 만드는 나만의 초대장

소셜 로그인 → 방 만들기 → 친구 초대(방장 승인) → 방 안에서 초대장 여러 개를 **실시간 동시 편집** → 이미지로 저장.
설계 논의는 [GitHub Discussions](https://github.com/blackpeachcake/merry-christmas/discussions) 참고 (#4 기능 확정 코멘트 기준).

## 모노레포 구조

```
merry-christmas/
├─ apps/
│  ├─ web/          # FE — Next.js 16 (App Router), Dockerfile 포함
│  └─ api/          # BE — NestJS (스캐폴딩 예정)
├─ packages/
│  └─ shared/       # FE/BE 공유 TypeScript 타입
├─ .github/         # CI(PR 검사), PR 자동 담당자·리뷰어 지정, PR 템플릿
├─ lefthook.yml     # Git 훅 (prettier·eslint / commitlint / typecheck·test)
└─ tsconfig.base.json
```

## 시작하기

```bash
nvm use            # Node 22
corepack enable    # pnpm (package.json의 packageManager 버전)
pnpm install       # lefthook 훅도 자동 설치
cp apps/web/.env.example apps/web/.env.local
pnpm dev:web
```

휴대폰에서 개발 서버 열기: `DEV_ALLOWED_ORIGINS=<PC의 IP> pnpm dev:web` 후 `http://<PC의 IP>:3000`.

## 스크립트

| 명령                                         | 내용                                        |
| -------------------------------------------- | ------------------------------------------- |
| `pnpm dev:web` / `pnpm build:web`            | 웹 개발 서버 / 프로덕션 빌드                |
| `pnpm lint` · `pnpm typecheck` · `pnpm test` | 전체 워크스페이스 검사                      |
| `pnpm format` · `pnpm format:check`          | Prettier                                    |
| `pnpm --filter web test:e2e`                 | Playwright E2E (Pixel 7 / iPhone 15 뷰포트) |

## 배포

GKE(Autopilot) 예정 — [#7 인프라 설계](https://github.com/blackpeachcake/merry-christmas/discussions/7).

```bash
docker build -f apps/web/Dockerfile --build-arg NEXT_PUBLIC_API_URL=... -t merry-web .
```

k8s 매니페스트와 배포 워크플로는 BE와 API·데이터 구조가 정해진 뒤 추가한다.
