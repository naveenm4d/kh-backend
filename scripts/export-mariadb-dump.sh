#!/usr/bin/env bash
# Dumps the local MariaDB database (docker compose service `mariadb`) into a gzipped SQL file that
# cPanel's phpMyAdmin can import into an empty database: schema, data and the migrations table, with
# no CREATE DATABASE/USE (cPanel prefixes database names) and no DEFINERs.
#
#   scripts/export-mariadb-dump.sh            # -> storage/app/kulatissa-YYYYMMDD-HHMM.sql.gz
#   scripts/export-mariadb-dump.sh out.sql.gz
set -euo pipefail

cd "$(dirname "$0")/.."

env_value() { grep -E "^$1=" .env | tail -n1 | cut -d= -f2- | sed -e 's/^"//' -e 's/"$//'; }

db="$(env_value DB_DATABASE)"
user="$(env_value DB_USERNAME)"
pass="$(env_value DB_PASSWORD)"
out="${1:-storage/app/kulatissa-$(date +%Y%m%d-%H%M).sql.gz}"

if [ -z "$db" ] || [ -z "$user" ]; then
    echo "DB_DATABASE and DB_USERNAME must be set in .env" >&2
    exit 1
fi

# The newest mariadb-dump writes a "sandbox mode" first line that older importers reject; drop it.
docker compose exec -T -e MYSQL_PWD="$pass" mariadb mariadb-dump \
    --user="$user" \
    --single-transaction --skip-lock-tables --skip-add-locks \
    --no-tablespaces --skip-triggers --hex-blob \
    --default-character-set=utf8mb4 \
    "$db" \
    | sed -e '1{/sandbox mode/d;}' \
    | gzip -9 > "$out"

echo "Wrote $out ($(du -h "$out" | cut -f1)). Import it in phpMyAdmin into the empty cPanel database."
