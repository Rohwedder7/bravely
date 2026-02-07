# Stage 1: Build
FROM node:22-alpine AS builder

RUN corepack enable && corepack prepare pnpm@10.22.0 --activate

WORKDIR /app

COPY package.json pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile

COPY tsconfig.json ./
COPY server ./server

RUN pnpm run build

# Stage 2: Produção
FROM node:22-alpine AS runner

LABEL maintainer="Brev.ly" \
      description="API do encurtador de links Brev.ly"

RUN corepack enable && corepack prepare pnpm@10.22.0 --activate

WORKDIR /app

ENV NODE_ENV=production

RUN addgroup --system --gid 1001 nodejs \
  && adduser --system --uid 1001 fastify

COPY package.json pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile --prod

COPY --from=builder /app/dist ./dist

RUN chown -R fastify:nodejs /app

USER fastify

EXPOSE 3333

# Verifica se GET /links responde 200 (script CJS em processo separado)
HEALTHCHECK --interval=30s --timeout=3s --start-period=10s --retries=3 \
  CMD node -e "require('http').get('http://127.0.0.1:3333/links', (r) => process.exit(r.statusCode === 200 ? 0 : 1)).on('error', () => process.exit(1))"

CMD ["node", "dist/server.js"]
