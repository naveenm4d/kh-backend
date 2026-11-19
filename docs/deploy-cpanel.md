# Deploying to cPanel

How to run the backend on a shared cPanel account that has MariaDB, phpMyAdmin and Git Version Control but no SSH. Nothing is built on the server: you build on your own machine and cPanel pulls the result from a branch.

| Where           | What                                                                       |
| --------------- | -------------------------------------------------------------------------- |
| Your machine    | Build the release (`vendor/`, `public/build/`), export the database dump   |
| GitHub          | `cpanel-deploy` branch: built files only; source stays on your other branches |
| cPanel          | Clone of `cpanel-deploy` in `~/public_html/subaora.com/repositories/kh-backend`, `.env` beside it |
| Subdomain       | Document root: `public_html/subaora.com/repositories/kh-backend/public`                    |

The examples use `api.example.lk`; use your own subdomain.

## 1. Move the data (first time only)

You need the old Postgres container and the new MariaDB container running locally:

```bash
docker compose --profile legacy up -d pgsql   # the old database
docker compose up -d mariadb                  # the new one
```

In `.env`, set `DB_CONNECTION=mariadb` and the `LEGACY_PG_*` values (the old `DB_*` Postgres settings). Then:

```bash
php artisan db:copy-from-postgres    # rebuilds MariaDB, copies everything, checks totals match
scripts/export-mariadb-dump.sh       # -> storage/app/kulatissa-<date>.sql.gz
```

- The copy ends with a table of row counts and money totals for both sides. Every line must say `ok`. If any line says `MISMATCH`, the command fails; don't ship that database.
- Tills sign in again once they point at the new server; their registrations (terminal keys) carry over.
- **Keep the same `APP_KEY`.** The production `.env` needs the `APP_KEY` from the `.env` that wrote this data. 2FA secrets and session data are encrypted with it.
- Passkeys belong to a domain. Anyone who used one on another address registers it again.

## 2. Build a release

On a clean working tree (commit first):

```bash
scripts/build-cpanel-release.sh --push
```

This exports `HEAD` and installs production Composer packages. It builds the frontend and commits the result as `Release <sha>` on the `cpanel-deploy` branch, then pushes it. At the end it prints the PHP version and extensions the server needs.

## 3. Set up cPanel (first time only)

1. **Subdomain.** Domains → Create a new domain: `api.example.lk`. Uncheck "share document root" and set the document root to `public_html/subaora.com/repositories/kh-backend/public`. Create the folder later in step 4 if cPanel complains that it's missing.
2. **HTTPS.** SSL/TLS Status → run AutoSSL for the subdomain. Domains → turn on **Force HTTPS Redirect**. The tills refuse plain HTTP.
3. **PHP.** MultiPHP Manager → set the subdomain to **PHP 8.4** (8.4.1 or newer). In Select PHP Version → Extensions (if your host has it), enable at least `pdo_mysql`, `mbstring`, `openssl`, `tokenizer`, `dom`, `xml`, `ctype`, `fileinfo`, `iconv`, plus anything the build script listed.
4. **Database.**
   1. MySQL Databases → create a database (cPanel prefixes it, e.g. `cpuser_kulatissa`) and a user with a strong password. Add the user to the database with **ALL PRIVILEGES**.
   2. phpMyAdmin → select the new, empty database → Import → choose `kulatissa-<date>.sql.gz` → Go. Leave the format as SQL.
   3. If the file is over the upload limit shown there, ask your host to raise it or to import it for you.
5. **Code.** Git Version Control → Create:
   - Clone URL: `https://github.com/naveenm4d/kh-backend.git`. For a private repo, use a GitHub fine-grained token with read-only *Contents* access on this one repo: `https://<token>@github.com/naveenm4d/kh-backend.git`. If your plan has SSH Access → Manage Keys, a read-only deploy key works too.
   - Repository path: `public_html/subaora.com/repositories/kh-backend`.
   - After it clones: Manage → Basic Information → **Checked-Out Branch: `cpanel-deploy`**.
6. **`.env`.** File Manager → `public_html/subaora.com/repositories/kh-backend` → create `.env` (turn on "Show Hidden Files"):

   ```dotenv
   APP_NAME="Kulatissa Hardware"
   APP_ENV=production
   APP_KEY=base64:...                    # the same key as the install the data came from
   APP_DEBUG=false
   APP_URL=https://api.example.lk

   LOG_CHANNEL=stack
   LOG_STACK=daily
   LOG_LEVEL=warning

   DB_CONNECTION=mariadb
   DB_HOST=localhost
   DB_PORT=3306
   DB_DATABASE=cpuser_kulatissa
   DB_USERNAME=cpuser_kulatissa
   DB_PASSWORD=...

   SESSION_DRIVER=database
   SESSION_LIFETIME=120
   SESSION_ENCRYPT=true
   SESSION_SECURE_COOKIE=true
   CACHE_STORE=database
   QUEUE_CONNECTION=sync
   FILESYSTEM_DISK=local
   MAIL_MAILER=log

   # Leave empty unless the site sits behind a proxy such as Cloudflare.
   TRUSTED_PROXIES=
   SANCTUM_EXPIRATION=720
   ```

   Set its permissions to `600`. It lives outside the document root, so the web can't reach it.
7. **Writable folders.** `storage/` (and everything under it) and `bootstrap/cache/` need `755` on folders. That is cPanel's default, so usually there's nothing to do.
8. **Deploy.** Git Version Control → Manage → Pull or Deploy → **Deploy HEAD Commit**. `.cpanel.yml` runs `scripts/cpanel-deploy.sh`, which:
   - finds a PHP 8.4+ command-line binary (MultiPHP only sets the website's version, not the shell's);
   - checks that `vendor/`, `public/build/` and `.env` are there;
   - runs `artisan migrate --force` and `artisan optimize`.

   Its output, errors included, is in the newest `~/.cpanel/logs/vc_*_git_deploy.log`. The last line should read `Deploy finished.` The script path in `.cpanel.yml` must match where the repository is cloned (currently `/home/subaorac/public_html/subaora.com/repositories/kh-backend`); change it on your source branch and rebuild if you move it.

Check:

- `https://api.example.lk/up` shows a green "Application up" page.
- `https://api.example.lk/admin` goes to the sign-in page, and your admin account works.
- `https://api.example.lk/.env` is a 404.
- On each till: Settings → Connection → server `https://api.example.lk`, same terminal key. Sign in and check that products load.

## 4. Updating

1. Commit your changes, then run `scripts/build-cpanel-release.sh --push`.
2. In cPanel: Git Version Control → Manage → Pull or Deploy → **Update from Remote**, then **Deploy HEAD Commit**.

Migrations and caches run on deploy. Deploy also refreshes the config cache, so redeploy after you edit `.env`.

## If deploy tasks don't run

Some hosts don't run `.cpanel.yml` tasks on accounts without shell access. In that case:

- **The app still works.** "Update from Remote" alone updates the files; Laravel just runs without its config and route caches.
- **Don't leave a stale cache behind.** If a cache was built once and `.env` changes later, delete `bootstrap/cache/config.php` in File Manager.
- **Schema changes go through phpMyAdmin.** On your machine, against the local MariaDB copy, run:

  ```bash
  php artisan migrate --pretend      # prints the SQL each pending migration would run
  ```

  Paste that SQL into phpMyAdmin → SQL, then record each migration as run, with the next batch number:

  ```sql
  INSERT INTO migrations (migration, batch) VALUES ('2026_12_01_000000_example', 2);
  ```

  `--pretend` only shows SQL, not PHP logic such as data fixes in a migration. For a migration with such logic, run it locally against a copy of production, then export and import the affected tables instead.

## Backups

phpMyAdmin → Export → Quick → SQL, or cPanel → Backup → download a MySQL database backup. Do it before every deploy that includes migrations.
