## Engine Proxy

A self-hosted Next.js app that acts as a shortcut-aware search proxy. Add as many search engines or AI tools as you like, then search with commands such as `@duck privacy coins` or fall back to your default provider.

### Features

- SQLite + Prisma persistence with seed data for 12 privacy-friendly engines.
- Public search bar that understands `@shortcut query` syntax and lists all available engines.
- Basic Auth-protected admin area for creating, editing, deleting, and setting default shortcuts.
- API endpoints (`/api/shortcuts`) for programmatic management.
- Dockerfile and Compose stack for one-command self-hosting (database stored on a volume).

### Requirements

- Node.js 22+
- pnpm (Corepack already enabled)
- SQLite (bundled through `better-sqlite3`)

### Local setup

1. **Install dependencies**
   ```bash
   pnpm install
   ```
2. **Configure environment** – copy `.env.example` to `.env` and set:
   ```bash
   DATABASE_URL="file:./prisma/data.db"
   ADMIN_USERNAME="your-admin"
   ADMIN_PASSWORD="super-secret"
   ```
3. **Sync the database and seed defaults**
   ```bash
   pnpm db:push
   pnpm db:seed
   ```
4. **Start the dev server**
   ```bash
   pnpm dev
   ```
   Visit http://localhost:3000 for the public search page and http://localhost:3000/admin for the admin console (browser will prompt for the Basic Auth credentials).

### Usage

- Search normally to use the currently selected/default shortcut.
- Override on the fly with `@shortcut query` (for example `@perplexity quantum gravity`).
- Manage shortcuts from `/admin` or via the JSON API (`/api/shortcuts`).

### Browser integration

- Add Engine Proxy itself as a custom search engine in your browser with `http://localhost:3000/search/%s` (swap the host/port to match your deployment). Typing `@shortcut query` in the omnibox will trigger the proxy and forward you to the correct destination.
- Prefer to wire engines directly? Copy any of the templates below (replace `%s` with your query – most browsers do this automatically):
  - DuckDuckGo – `https://duckduckgo.com/?q=%s`
  - Brave Search – `https://search.brave.com/search?q=%s`
  - Perplexity AI – `https://www.perplexity.ai/search?q=%s`
  - Bing – `https://www.bing.com/search?q=%s`

### Prisma helpers

```bash
pnpm db:push         # apply schema changes to SQLite
pnpm db:seed         # re-seed default engines (idempotent)
pnpm prisma:generate  # regenerate the Prisma client if needed
```

### Docker

The repository ships with a multi-stage Dockerfile and a compose stack that persists the SQLite database on a named volume. The new `.dockerignore` keeps dev artifacts (including `.env`) out of the build context so secrets are only injected at runtime.

```bash
# Build a production image
docker build -t engine-proxy:latest .

# Run it anywhere, injecting env vars at runtime
docker run --env-file ./.env \
   -p 3000:3000 \
   --name engine-proxy \
   engine-proxy:latest
```

Prefer Compose?

```bash
docker compose up
```

Copy `docker-compose.yml`, edit the inline `ADMIN_USERNAME`, `ADMIN_PASSWORD`, and other variables, then run `docker compose up`. By default the SQLite file is stored on a Docker named volume, but you can uncomment the bind mount in the compose file to persist it under `./engine-proxy/database/` on the host.

Environment variables:

- `DATABASE_URL` – path to the SQLite file (default `file:./prisma/data.db`).
- `ADMIN_USERNAME` / `ADMIN_PASSWORD` – required for admin + API access.
- `SKIP_DB_SETUP=true` – optionally skip the automatic `pnpm db:push` + `pnpm db:seed` that run on container start.

When you provide an `--env-file` (or inline `-e` flags) to plain `docker run`, Docker injects those values only when the container starts, so you can safely keep production credentials outside the image. The compose file binds port `3000` and mounts the `/app/prisma` directory to keep `data.db` between restarts.
