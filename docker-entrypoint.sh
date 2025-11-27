#!/bin/sh
set -eu

DATABASE_URL="${DATABASE_URL:-file:./prisma/data.db}"
export DATABASE_URL

# Ensure the SQLite directory exists before Prisma touches it
case "$DATABASE_URL" in
  file:*)
    sqlite_path="${DATABASE_URL#file:}"
    sqlite_dir="$(dirname "$sqlite_path")"
    mkdir -p "$sqlite_dir"
    ;;
esac

SKIP_DB_SETUP="${SKIP_DB_SETUP:-false}"

if [ "$SKIP_DB_SETUP" != "true" ]; then
  echo "Applying Prisma schema..."
  pnpm db:push >/dev/null 2>&1 || pnpm db:push
  echo "Seeding defaults (safe to rerun)..."
  pnpm db:seed || true
fi

echo "Starting Engine Proxy..."
exec pnpm start
