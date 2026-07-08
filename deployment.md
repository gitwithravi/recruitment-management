# Docker Deployment

This deployment runs the Recruitment app with Docker Compose:

- `app` - Next.js production server on container port `3033`
- `postgres` - PostgreSQL 17 with a persistent volume
- `migrate` - one-off Prisma migration service
- `seed` - optional one-off seed service for the local admin account

The app is published on host port `3033` by default: `http://SERVER_IP:3033`.

## Prerequisites

- Docker Engine with Docker Compose v2
- A server with outbound network access during image build, because `next build` fetches Google font assets
- A DNS name and TLS-capable reverse proxy for internet-facing production use

## 1. Create Environment Variables

Create a `.env` file next to `docker-compose.yml` on the deployment host:

```bash
POSTGRES_DB=recruitment
POSTGRES_USER=recruitment
POSTGRES_PASSWORD=replace-with-a-strong-database-password

AUTH_SECRET=replace-with-at-least-32-random-characters
NEXT_PUBLIC_APP_NAME=Recruitment
ENABLE_USER_CSV_EXPORT=false

SMTP_HOST=smtp.example.com
SMTP_PORT=587
SMTP_USER=notifications@example.com
SMTP_PASS=replace-with-smtp-password
SMTP_FROM=Recruitment <notifications@example.com>
```

Generate a strong `AUTH_SECRET`:

```bash
openssl rand -base64 32
```

For multi-container or rolling deployments of the same build, also set a stable `NEXT_SERVER_ACTIONS_ENCRYPTION_KEY` during build and runtime. Use a base64-encoded 16, 24, or 32 byte key.

## 2. Build Images

```bash
docker compose build app migrate seed
```

## 3. Start PostgreSQL

```bash
docker compose up -d postgres
```

Wait until PostgreSQL is healthy:

```bash
docker compose ps
```

## 4. Run Migrations

```bash
docker compose run --rm migrate
```

For a first-time deployment only, seed the default admin account:

```bash
docker compose run --rm seed
```

Default seeded admin:

- username: `admin`
- email: `admin@example.com`
- password: `Admin@123`

Change this password immediately after the first login.

## 5. Start the App

```bash
docker compose up -d app
```

Open:

```text
http://SERVER_IP:3033
```

Useful operations:

```bash
docker compose logs -f app
docker compose ps
docker compose restart app
docker compose down
```

## Updates

For each new release:

```bash
docker compose build app migrate seed
docker compose up -d postgres
docker compose run --rm migrate
docker compose up -d app
```

If static assets or server action identifiers change, avoid serving old and new app containers behind the same proxy unless they share a compatible deployment configuration.

## Persistent Data

Compose creates these named volumes:

- `postgres_data` - PostgreSQL data
- `app_storage` - uploaded resumes and comment attachments

Back up both volumes. Database backups alone are not enough because uploaded files live in `app_storage`.

Example volume backup approach:

```bash
docker run --rm -v recruitment-management_postgres_data:/volume -v "$PWD/backups:/backup" alpine tar czf /backup/postgres_data.tgz -C /volume .
docker run --rm -v recruitment-management_app_storage:/volume -v "$PWD/backups:/backup" alpine tar czf /backup/app_storage.tgz -C /volume .
```

Adjust volume names if your Compose project name differs.

## Reverse Proxy

Do not expose the Next.js process directly to the public internet for production. Put a reverse proxy such as Nginx, Caddy, Traefik, or a cloud load balancer in front of host port `3033`.

The reverse proxy should:

- Terminate TLS.
- Forward traffic to `http://127.0.0.1:3033`.
- Preserve `Host`, `X-Forwarded-For`, `X-Forwarded-Proto`, and `X-Real-IP`.
- Support streaming/chunked responses and WebSocket upgrades.
- Set sensible request body limits for resume and attachment uploads. The app allows resumes up to 10 MB and attachments up to 25 MB.
- Apply edge rate limits and request filtering where possible.

Minimal Nginx example:

```nginx
server {
    listen 80;
    server_name recruitment.example.com;

    client_max_body_size 30m;

    location / {
        proxy_pass http://127.0.0.1:3033;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_buffering off;
    }
}
```

For public production traffic, add TLS certificates, redirect HTTP to HTTPS, and set any organization-specific security headers at the proxy layer.

Minimal Caddy example:

```caddyfile
recruitment.example.com {
    request_body {
        max_size 30MB
    }

    reverse_proxy 127.0.0.1:3033 {
        header_up X-Real-IP {remote_host}
        header_up X-Forwarded-Proto {scheme}
    }
}
```

## Troubleshooting

Check app logs:

```bash
docker compose logs -f app
```

Check database health:

```bash
docker compose exec postgres pg_isready -U "$POSTGRES_USER" -d "$POSTGRES_DB"
```

Re-run migrations:

```bash
docker compose run --rm migrate
```

If uploads fail, confirm the `app_storage` volume is mounted and writable:

```bash
docker compose exec app sh -lc 'touch storage/.write-test && rm storage/.write-test'
```
