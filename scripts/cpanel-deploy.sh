#!/usr/bin/env bash
# Runs on the cPanel server after "Deploy HEAD Commit" (called from .cpanel.yml). Finds a PHP CLI
# new enough for the app, then migrates and rebuilds Laravel's caches. Everything it prints, errors
# included, lands in the deploy log (~/.cpanel/logs/vc_*_git_deploy.log).
set -uo pipefail
exec 2>&1

app_dir="${1:-$(cd "$(dirname "$0")/.." && pwd)}"
cd "$app_dir" || { echo "Can't open $app_dir"; exit 1; }
echo "App: $app_dir"

# MultiPHP sets the version for the website, not for this shell, so look for a PHP 8.4+ binary:
# cPanel EasyApache, then CloudLinux alt-php, then whatever is on the PATH.
php=""
for candidate in \
    /opt/cpanel/ea-php85/root/usr/bin/php /opt/cpanel/ea-php84/root/usr/bin/php \
    /opt/alt/php85/usr/bin/php /opt/alt/php84/usr/bin/php \
    /usr/local/bin/php "$(command -v php || true)"; do
    [ -n "$candidate" ] && [ -x "$candidate" ] || continue
    if "$candidate" -r 'exit(PHP_VERSION_ID >= 80401 ? 0 : 1);' >/dev/null 2>&1; then
        php="$candidate"
        break
    fi
    echo "Skipping $candidate: $("$candidate" -r 'echo PHP_VERSION;' 2>/dev/null || echo unknown) is older than 8.4.1"
done
if [ -z "$php" ]; then
    echo "No PHP 8.4.1+ CLI found. Install PHP 8.4 for the account (MultiPHP Manager / Select PHP Version) or ask the host which path it lives at."
    exit 1
fi
echo "PHP: $php ($("$php" -r 'echo PHP_VERSION;'))"

if [ ! -f vendor/autoload.php ] || [ ! -f public/build/manifest.json ]; then
    echo "vendor/ or public/build/ is missing. In Git Version Control, check out the cpanel-deploy branch (built by scripts/build-cpanel-release.sh)."
    exit 1
fi
if [ ! -f .env ]; then
    echo "No .env in $app_dir. Create it first (see docs/deploy-cpanel.md)."
    exit 1
fi

for ext in pdo_mysql mbstring openssl tokenizer dom ctype fileinfo; do
    "$php" -r "exit(extension_loaded('$ext') ? 0 : 1);" || echo "Warning: PHP extension $ext is not enabled for the CLI."
done

mkdir -p storage/framework/{cache/data,sessions,views} storage/logs bootstrap/cache

"$php" artisan migrate --force --no-interaction || { echo "Migration failed (see above)."; exit 1; }
"$php" artisan optimize --no-interaction || { echo "Caching failed (see above)."; exit 1; }

echo "Deploy finished."
