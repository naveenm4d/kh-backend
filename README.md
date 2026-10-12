# Kulatissa Hardware — backend

This app is the server for Kulatissa Hardware. It holds all the shop's data and business rules in PostgreSQL, built on Laravel 13. It runs the **admin console** in the browser (Inertia + React) and the **POS API** the cashier tills use. The tills are the desktop app in `../desktopapp`.

## Local setup

Requirements: PHP 8.3+, Composer, Node 22+, and Docker (used for Postgres only).

```bash
cp .env.example .env          # set DB_PASSWORD (and ADMIN_EMAIL / ADMIN_PASSWORD if you like)
docker compose up -d          # Postgres 17 on :5432 (+ a "testing" database for the test suite)
composer install && npm install
php artisan key:generate
php artisan migrate --seed    # roles, shop settings, first admin
php artisan db:seed --class=DemoSeeder   # optional demo data; prints a till key
composer run dev              # http://localhost:8000
```

Sign in at http://localhost:8000. Demo accounts:

| Where         | Account                        | Password      |
| ------------- | ------------------------------ | ------------- |
| Admin console | `admin@kulatissahardware.lk`   | `password123` |
| Till          | Kasun or Nuwan (tap your name) | `password123` |

## Connecting a till

1. In the admin console, open **Settings → Tills → Register a till** and copy the key. It is shown only once.
2. On the till computer, open **Settings → Connection**. Enter the server address and the key.
3. To cut a till off, revoke it. Anyone signed in on it is signed out straight away.

## Checks

```bash
composer test        # Pint, PHPStan (level 7), Pest — needs the docker Postgres running
npm run check        # lint + formatting
npm run types:check
npm run build
```

## Production notes

Set these in `.env`:

- `APP_ENV=production`, `APP_DEBUG=false`, and an `https://` `APP_URL`.
- Strong DB credentials.
- `ADMIN_EMAIL` / `ADMIN_PASSWORD` for the first seed.
- `TRUSTED_PROXIES` if you're behind a proxy or load balancer.
- `SESSION_SECURE_COOKIE=true`.

Then run `php artisan config:cache route:cache view:cache`.

The tills require HTTPS.

Business rules are documented in `.claude/domains/`.
