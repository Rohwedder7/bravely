# Stage 1: Build do monorepo (web + server)
FROM node:22-alpine AS builder

RUN corepack enable && corepack prepare pnpm@10.22.0 --activate

WORKDIR /app

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY server/package.json ./server/
COPY web/package.json ./web/

RUN pnpm install --frozen-lockfile

COPY server ./server
COPY web ./web

RUN pnpm --filter web build
RUN pnpm --filter server build

# Stage 2: Produção (API + frontend estático)
FROM node:22-alpine AS runner

LABEL maintainer="Brev.ly" \
      description="Encurtador de links Brev.ly (API + SPA)"

RUN corepack enable && corepack prepare pnpm@10.22.0 --activate

WORKDIR /app

ENV NODE_ENV=production

RUN addgroup --system --gid 1001 nodejs \
  && adduser --system --uid 1001 fastify

# Apenas package.json dos workspaces para instalar deps de produção
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY server/package.json ./server/
COPY web/package.json ./web/

RUN pnpm install --frozen-lockfile --prod

# Artefatos de build: backend compilado + frontend estático
COPY --from=builder /app/server/dist ./server/dist
COPY --from=builder /app/web/dist ./server/public

RUN chown -R fastify:nodejs /app

USER fastify

EXPOSE 3333

ENV PUBLIC_DIR=server/public

HEALTHCHECK --interval=30s --timeout=3s --start-period=10s --retries=3 \
  CMD node -e "require('http').get('http://127.0.0.1:3333/links', (r) => process.exit(r.statusCode === 200 ? 0 : 1)).on('error', () => process.exit(1))"

CMD ["node", "server/dist/server.js"]
