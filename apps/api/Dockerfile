# build context = repo root (pnpm 모노레포)
FROM node:20-alpine AS build
RUN corepack enable
WORKDIR /repo
COPY pnpm-lock.yaml pnpm-workspace.yaml package.json ./
COPY apps/api/package.json apps/api/
COPY packages/shared/package.json packages/shared/
RUN pnpm install --frozen-lockfile
COPY . .
RUN pnpm --filter api build

FROM node:20-alpine AS run
RUN corepack enable
WORKDIR /repo
# ponytail: 워크스페이스 전체(dev deps 포함) 복사 — 확실하게 동작. prod-prune(pnpm deploy)로 이미지 축소는 나중에.
COPY --from=build /repo /repo
WORKDIR /repo/apps/api
ENV NODE_ENV=production
EXPOSE 3000
CMD ["node", "dist/main.js"]
