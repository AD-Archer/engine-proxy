# Engine Proxy Docker Image

A lightweight Next.js service that proxies searches through customizable shortcuts. This document is optimized for Docker Hub and describes how to run the prebuilt image.

## Quick start

```bash
docker run -d \
  --name engine-proxy \
  -p 3000:3000 \
  -v engine-proxy-data:/app/prisma \
  -e DATABASE_URL="file:./prisma/data.db" \
  -e ADMIN_USERNAME="admin" \
  -e ADMIN_PASSWORD="change-me" \
  adarcher/engine-proxy:latest
```

- The `engine-proxy-data` named volume keeps the SQLite database (`/app/prisma/data.db`) between restarts.
- Set `ADMIN_USERNAME` and `ADMIN_PASSWORD` to control Basic Auth for `/admin` and the management API.
- Add `-e SKIP_DB_SETUP=true` if you want to skip automatic seeding on startup; schema push (`pnpm db:push`) still runs.

## Environment variables

| Name             | Required | Default                 | Description                                                                |
| ---------------- | -------- | ----------------------- | -------------------------------------------------------------------------- |
| `DATABASE_URL`   | optional | `file:./prisma/data.db` | SQLite connection string; keep the `file:` prefix when storing locally.    |
| `ADMIN_USERNAME` | yes      | –                       | Username for the Basic Auth-protected admin console and API.               |
| `ADMIN_PASSWORD` | yes      | –                       | Password paired with `ADMIN_USERNAME`.                                     |
| `COOKIE_SECURE`  | no       | auto                    | Force secure cookies if your TLS proxy strips `X-Forwarded-Proto`; leave unset for HTTP. |
| `SKIP_DB_SETUP`  | no       | `false`                 | Set to `true` to skip only the seed step; Prisma schema push still runs. |

## Docker Compose

Copy the snippet below into `docker-compose.yml`, adjust inline values, and run `docker compose up -d`:

```yaml
services:
  engine-proxy-migrate:
    image: adarcher/engine-proxy:latest
    environment:
      DATABASE_URL: "file:./prisma/data.db"
    volumes:
      - engine-proxy-data:/app/prisma
    entrypoint: ["/app/docker-migrate.sh"]
    restart: "no"

  engine-proxy:
    image: adarcher/engine-proxy:latest
    depends_on:
      engine-proxy-migrate:
        condition: service_completed_successfully
    ports:
      - "3000:3000"
    environment:
      DATABASE_URL: "file:./prisma/data.db"
      ADMIN_USERNAME: "admin"
      ADMIN_PASSWORD: "change-me"
      SKIP_DB_SETUP: "true" # skip seed on app boot; db:push still runs (seed handled by engine-proxy-migrate)
    volumes:
      - engine-proxy-data:/app/prisma
      # - ./database:/app/prisma # uncomment to bind to a host folder
    restart: unless-stopped

volumes:
  engine-proxy-data:
```

When you pull a newer image with schema changes, rerun the migration service once:

```bash
docker compose run --rm --no-deps engine-proxy-migrate
docker compose up -d engine-proxy
```
