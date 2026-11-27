# syntax=docker/dockerfile:1
# 빌드 컨텍스트는 모노레포 루트: docker build -f apps/web/Dockerfile .

FROM node:22-alpine AS base
RUN corepack enable
WORKDIR /repo

# 1) 의존성 — lockfile과 package.json만 먼저 복사해 레이어 캐시를 살린다.
FROM base AS deps
COPY pnpm-lock.yaml pnpm-workspace.yaml package.json ./
COPY apps/web/package.json apps/web/
COPY packages/shared/package.json packages/shared/
RUN --mount=type=cache,id=pnpm,target=/root/.local/share/pnpm/store \
    pnpm install --frozen-lockfile --filter web... --ignore-scripts

# 2) 빌드
FROM base AS build
COPY --from=deps /repo ./
COPY tsconfig.base.json ./
COPY packages/shared packages/shared
COPY apps/web apps/web
# NEXT_PUBLIC_* 은 빌드 시점에 번들에 박힌다 → CI에서 --build-arg로 넘긴다.
ARG NEXT_PUBLIC_API_URL
ENV NEXT_PUBLIC_API_URL=$NEXT_PUBLIC_API_URL
ENV NEXT_TELEMETRY_DISABLED=1
RUN pnpm --filter web build

# 3) 실행 — standalone 출력만 담는다.
FROM node:22-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production \
    NEXT_TELEMETRY_DISABLED=1 \
    PORT=3000 \
    # 없으면 localhost에만 바인딩돼 k8s probe가 실패한다.
    HOSTNAME=0.0.0.0
RUN addgroup -S nodejs -g 1001 && adduser -S nextjs -u 1001 -G nodejs
# outputFileTracingRoot가 모노레포 루트라 standalone 안에 apps/web 경로가 그대로 유지된다.
COPY --from=build --chown=nextjs:nodejs /repo/apps/web/.next/standalone ./
# standalone은 static·public을 복사하지 않으므로 직접 넣는다.
COPY --from=build --chown=nextjs:nodejs /repo/apps/web/.next/static ./apps/web/.next/static
COPY --from=build --chown=nextjs:nodejs /repo/apps/web/public ./apps/web/public
USER nextjs
EXPOSE 3000
CMD ["node", "apps/web/server.js"]
