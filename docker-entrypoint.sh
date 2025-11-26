#!/bin/sh
set -euo pipefail

if [ "${SKIP_DB_SETUP:-false}" != "true" ]; then
  echo "Applying Prisma schema..."
  pnpm db:push >/dev/null 2>&1 || pnpm db:push
  echo "Seeding defaults (safe to rerun)..."
  pnpm db:seed || true
fi

echo "Starting Engine Proxy..."
pnpm start
