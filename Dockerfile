## syntax=docker/dockerfile:1.8

# ---- Base image ----
FROM node:20-bookworm-slim AS base

ARG PNPM_VERSION=9.12.1
ENV PNPM_HOME="/pnpm"
ENV PATH="${PNPM_HOME}:${PATH}"
ENV NEXT_TELEMETRY_DISABLED=1
ENV DATABASE_URL="file:./prisma/data.db"
ENV PORT=3000

WORKDIR /app

# Install runtime OS packages and pnpm via corepack
RUN --mount=type=cache,target=/var/cache/apt \
		--mount=type=cache,target=/var/lib/apt \
		apt-get update && \
		apt-get install -y --no-install-recommends \
			ca-certificates \
			openssl \
			sqlite3 \
			bash \
		&& rm -rf /var/lib/apt/lists/* && \
		corepack enable && \
		corepack prepare "pnpm@${PNPM_VERSION}" --activate


# ---- Dependencies ----
FROM base AS deps

# Toolchain for native modules such as better-sqlite3
RUN --mount=type=cache,target=/var/cache/apt \
		--mount=type=cache,target=/var/lib/apt \
		apt-get update && \
		apt-get install -y --no-install-recommends \
			build-essential \
			python3 \
			pkg-config \
		&& rm -rf /var/lib/apt/lists/*

COPY package.json pnpm-lock.yaml ./
COPY pnpm-workspace.yaml ./
COPY prisma ./prisma
COPY prisma.config.ts ./prisma.config.ts

RUN pnpm install --frozen-lockfile


# ---- Build ----
FROM deps AS build

COPY . .

RUN pnpm build


# ---- Production runner ----
FROM base AS runner

ENV NODE_ENV=production

# Copy the compiled node_modules (includes dev deps required for seeding)
COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /pnpm /pnpm

# Copy application code & build artifacts
COPY --from=build /app/.next ./.next
COPY --from=build /app/public ./public
COPY --from=build /app/prisma ./prisma
COPY --from=build /app/app ./app
COPY --from=build /app/lib ./lib
COPY --from=build /app/types ./types
COPY --from=build /app/components ./components
COPY --from=build /app/next.config.ts ./next.config.ts
COPY --from=build /app/prisma.config.ts ./prisma.config.ts
COPY --from=build /app/package.json ./package.json
COPY --from=build /app/pnpm-lock.yaml ./pnpm-lock.yaml
COPY --from=build /app/tsconfig.json ./tsconfig.json
COPY --from=build /app/docker-entrypoint.sh ./docker-entrypoint.sh

RUN chmod +x docker-entrypoint.sh

EXPOSE 3000
VOLUME ["/app/prisma"]

ENTRYPOINT ["/app/docker-entrypoint.sh"]
