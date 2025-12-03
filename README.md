## Engine Proxy

A self-hosted Next.js app that acts as a shortcut-aware search proxy. Add as many search engines or AI tools as you like, then search with commands such as `@duck privacy coins` or fall back to your default provider.

### Features

- SQLite + Prisma persistence with seed data for 12 privacy-friendly engines.
- Public search bar that understands `@shortcut query` syntax and lists all available engines.
- Basic Auth-protected admin area for creating, editing, deleting, and setting default shortcuts.
- API endpoints (`/api/shortcuts`) for programmatic management.
- Dockerfile and Compose stack for one-command self-hosting (database stored on a volume).

### Requirements

To run Engine Proxy, choose one of the following options:

#### Option 1: Using Docker (Recommended for easy setup)
- Docker

#### Option 2: Local development
- Node.js 22+
- pnpm (Corepack already enabled)
- SQLite (bundled through `better-sqlite3`)

### Docker

The Dockerfile now builds a fully self-contained Next.js image with pnpm, Prisma, and `better-sqlite3` ready to go. Nothing from your local `.env` is baked into the layers—the `.dockerignore` excludes it so secrets are only injected when a container starts.

1. Create the docker compose:
   ```yaml
   services:
  engine-proxy:
    image: adarcher/engine-proxy:latest
    container_name: engine-proxy
    ports:
      - "3000:3000"
    environment:
      DATABASE_URL: "file:./prisma/data.db" # change if you prefer a different SQLite path
      ADMIN_USERNAME: "admin"              # set your admin username
      ADMIN_PASSWORD: "change-me"          # set your admin password
      COOKIE_SECURE: false                 # set to true if you require HTTPS
      # SKIP_DB_SETUP: "true"              # uncomment to skip db push/seed on start
    volumes:
      - sqlite-data:/app/prisma # Named volume (default)
    restart: unless-stopped

volumes:
  sqlite-data:
   ```

2. Start the docker container
   ```bash
   docker compose up -d
   ```

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


Key environment variables:

- `DATABASE_URL` – path/connection string for Prisma (defaults to `file:./prisma/data.db` inside the container).
- `ADMIN_USERNAME` / `ADMIN_PASSWORD` – Basic Auth credentials for `/admin` and the API.
- `COOKIE_SECURE=true` – force secure cookies if your TLS terminator does not set `X-Forwarded-Proto`; leave unset for HTTP/local Docker so sign-in works.
- `SKIP_DB_SETUP=true` – skips the automatic `pnpm db:push` + `pnpm db:seed` that run on each container boot if you prefer to manage migrations yourself.

SQLite data lives under `/app/prisma`. The compose stack keeps it on the `sqlite-data` named volume by default, or you can bind-mount a host directory if you prefer to see the `data.db` file directly.
