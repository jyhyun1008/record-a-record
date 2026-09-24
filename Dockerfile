# node:22-slim (Debian/glibc) rather than alpine so better-sqlite3 can use
# its prebuilt binary instead of compiling from source against musl.
FROM node:22-slim AS base
WORKDIR /app

FROM base AS deps
# build-essential + python3 so node-gyp can compile better-sqlite3 from
# source when no prebuilt binary matches the target platform
RUN apt-get update && apt-get install -y --no-install-recommends \
    python3 make g++ openssl \
    && rm -rf /var/lib/apt/lists/*
COPY package.json package-lock.json ./
RUN npm ci

FROM base AS builder
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npx prisma generate
RUN npm run build

FROM base AS runner
ENV NODE_ENV=production
RUN apt-get update && apt-get install -y --no-install-recommends openssl \
    && rm -rf /var/lib/apt/lists/*

# same base image/arch as the builder, so native modules (better-sqlite3)
# compiled/fetched in node_modules stay compatible at runtime
COPY --from=deps /app/node_modules ./node_modules
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/app/generated ./app/generated
COPY --from=builder /app/public ./public
COPY --from=builder /app/prisma ./prisma
COPY package.json next.config.ts prisma7.config.ts ./
COPY docker-entrypoint.sh ./
RUN chmod +x docker-entrypoint.sh

EXPOSE 3000
ENTRYPOINT ["./docker-entrypoint.sh"]
CMD ["npx", "next", "start", "-H", "0.0.0.0", "-p", "3000"]
