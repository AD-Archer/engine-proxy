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
- Add `-e SKIP_DB_SETUP=true` if you manage migrations externally and want to skip the automatic `pnpm db:push` + `pnpm db:seed` on startup.

## Environment variables

| Name             | Required | Default                 | Description                                                                |
| ---------------- | -------- | ----------------------- | -------------------------------------------------------------------------- |
| `DATABASE_URL`   | optional | `file:./prisma/data.db` | SQLite connection string; keep the `file:` prefix when storing locally.    |
| `ADMIN_USERNAME` | yes      | –                       | Username for the Basic Auth-protected admin console and API.               |
| `ADMIN_PASSWORD` | yes      | –                       | Password paired with `ADMIN_USERNAME`.                                     |
| `SKIP_DB_SETUP`  | no       | `false`                 | Set to `true` to skip the Prisma push/seed step in `docker-entrypoint.sh`. |

## Docker Compose

Copy the snippet below into `docker-compose.yml`, adjust the inline values, and run `docker compose up --build`:

```yaml
version: "3.9"

services:
  engine-proxy:
    image: adarcher/engine-proxy:latest
    ports:
      - "3000:3000"
    environment:
      DATABASE_URL: "file:./prisma/data.db"
      ADMIN_USERNAME: "admin"
      ADMIN_PASSWORD: "change-me"
    volumes:
      - engine-proxy-data:/app/prisma
      # - ./database:/app/prisma # uncomment to bind to a host folder
    restart: unless-stopped

volumes:
  engine-proxy-data:
```
