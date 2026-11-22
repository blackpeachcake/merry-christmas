# 🎄 merry-christmas — 친구랑 만드는 나만의 초대장

소셜 로그인 → 2D 초대장(텍스트/배경/스티커) 제작 → 초대코드로 친구 **비동기 공동 편집** → 다운로드·공유.
설계 논의는 [GitHub Discussions](https://github.com/blackpeachcake/merry-christmas/discussions) 참고.

## 모노레포 구조

```
merry-christmas/
├─ apps/
│  ├─ web/          # FE — Next.js (React)
│  └─ api/          # BE — NestJS + PostgreSQL
├─ packages/
│  └─ shared/       # FE/BE 공유 TypeScript 타입 (invitation/block/dto/enum)
├─ pnpm-workspace.yaml
└─ package.json
```

- 패키지 매니저: **pnpm** (workspaces)
- `apps/web`, `apps/api`는 각 프레임워크 스캐폴더로 생성 예정(구현 플랜 단계).
- `packages/shared`는 양쪽에서 import하는 도메인 타입 단일 출처.

## 개발

```bash
pnpm install
pnpm dev:web   # Next dev
pnpm dev:api   # Nest dev
```

## 스택

| | |
|---|---|
| FE | Next.js, 블록 에디터, html-to-image 다운로드, 카카오 공유 |
| BE | NestJS, Prisma/TypeORM, Passport(kakao/google)+JWT, PostgreSQL |
| 스토리지 | Cloudflare R2 / S3 (presigned URL) |
