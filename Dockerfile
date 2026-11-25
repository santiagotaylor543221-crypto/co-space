
FROM node:22-bookworm-slim AS base

WORKDIR /app
ENV NEXT_TELEMETRY_DISABLED=1

RUN apt-get update \
    && apt-get install -y --no-install-recommends openssl \
    && rm -rf /var/lib/apt/lists/*

# ==========================================
# 1. DEPENDENCIES
# ==========================================
FROM base AS deps

COPY package.json package-lock.json ./
COPY prisma ./prisma
COPY prisma.config.ts ./

# URLs ficticias para generar Prisma Client
ENV DATABASE_URL=postgresql://build:build@localhost:5432/build
ENV DIRECT_URL=postgresql://build:build@localhost:5432/build

RUN npm ci

# ==========================================
# 2. BUILD
# ==========================================
FROM base AS builder

ENV NODE_ENV=production

# URLs ficticias para compilar Next.js
ENV DATABASE_URL=postgresql://build:build@localhost:5432/build
ENV DIRECT_URL=postgresql://build:build@localhost:5432/build

COPY --from=deps /app/node_modules ./node_modules
COPY . .

RUN npm run build

# ==========================================
# 3. PRODUCTION RUNNER
# ==========================================
FROM base AS runner

ENV NODE_ENV=production
ENV PORT=3000
ENV HOSTNAME=0.0.0.0

COPY --from=builder /app/package.json /app/package-lock.json ./
COPY --from=builder /app/node_modules ./node_modules

# Eliminar dependencias de desarrollo
RUN npm prune --omit=dev --ignore-scripts

COPY --chown=node:node --from=builder /app/.next ./.next
COPY --chown=node:node --from=builder /app/public ./public
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/prisma.config.ts ./prisma.config.ts
COPY --from=builder /app/next.config.ts ./next.config.ts

EXPOSE 3000

RUN mkdir -p /app/data/workspace-images && chown -R node:node /app/data
ENV WORKSPACE_UPLOAD_DIR=/app/data/workspace-images

USER node

# Ejecutar migraciones y arrancar Next.js
CMD ["sh", "-c", "./node_modules/.bin/prisma migrate deploy && npm run start"]
