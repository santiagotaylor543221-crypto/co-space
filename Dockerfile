FROM node:22-bookworm-slim AS base

WORKDIR /app
ENV NEXT_TELEMETRY_DISABLED=1

FROM base AS deps

COPY package.json package-lock.json ./
COPY prisma ./prisma
COPY prisma.config.ts ./

ENV DATABASE_URL=postgresql://build:build@localhost:5432/build
RUN npm ci

FROM base AS builder

ENV NODE_ENV=production
ENV DATABASE_URL=postgresql://build:build@localhost:5432/build

COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npm run build                                               

FROM base AS runner

ENV NODE_ENV=production
ENV PORT=3000
ENV HOSTNAME=0.0.0.0

COPY --from=builder /app/package.json /app/package-lock.json ./
COPY --from=builder /app/node_modules ./node_modules
RUN npm prune --omit=dev --ignore-scripts

COPY --chown=node:node --from=builder /app/.next ./.next
COPY --chown=node:node --from=builder /app/public ./public
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/prisma.config.ts ./prisma.config.ts
COPY --from=builder /app/next.config.ts ./next.config.ts

EXPOSE 3000

USER node

CMD ["sh", "-c", "./node_modules/.bin/prisma migrate deploy && npm run start"]
