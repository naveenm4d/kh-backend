#!/usr/bin/env bash
# Builds a deployable copy of the current commit for cPanel, where composer and npm can't run:
# production vendor/ and public/build/ are committed onto the `cpanel-deploy` branch, which cPanel's
# Git Version Control pulls. Source branches never carry built files.
#
#   scripts/build-cpanel-release.sh           # build and commit locally
#   scripts/build-cpanel-release.sh --push    # ...and push the branch to origin
#
# Env: TARGET_BRANCH (default cpanel-deploy), REMOTE (default origin).
set -euo pipefail

cd "$(dirname "$0")/.."
root="$(pwd)"
target="${TARGET_BRANCH:-cpanel-deploy}"
remote="${REMOTE:-origin}"
push=false
[ "${1:-}" = "--push" ] && push=true

if [ -n "$(git status --porcelain)" ]; then
    echo "Commit or stash your changes first: the release is built from HEAD." >&2
    exit 1
fi
sha="$(git rev-parse --short HEAD)"
tmp="$(mktemp -d)"
build="$tmp/build"
wt="$tmp/worktree"
cleanup() {
    git -C "$root" worktree remove --force "$wt" >/dev/null 2>&1 || true
    rm -rf "$tmp"
}
trap cleanup EXIT

echo "==> Exporting $sha"
mkdir -p "$build"
git archive HEAD | tar -x -C "$build"

cd "$build"
# Only for build-time artisan calls (package discovery, Wayfinder); never shipped.
cp .env.example .env
php -r 'file_put_contents(".env", preg_replace("/^APP_ENV=.*/m", "APP_ENV=production", file_get_contents(".env")));'

echo "==> composer install (production)"
composer install --no-dev --optimize-autoloader --no-interaction --no-progress --quiet
php artisan key:generate --force --quiet

echo "==> npm build"
npm ci --no-audit --no-fund --loglevel=error
npm run build

min_php="$(grep -o 'PHP_VERSION_ID >= [0-9]*' vendor/composer/platform_check.php | grep -o '[0-9]*$' || echo 0)"
# PHP extensions required by the app and its production packages.
exts="$(php -r '
    $lock = json_decode(file_get_contents("composer.lock"), true);
    $reqs = array_keys(json_decode(file_get_contents("composer.json"), true)["require"] ?? []);
    foreach ($lock["packages"] as $p) { $reqs = array_merge($reqs, array_keys($p["require"] ?? [])); }
    $exts = array_unique(array_map(fn ($r) => substr($r, 4), array_filter($reqs, fn ($r) => str_starts_with($r, "ext-"))));
    sort($exts);
    echo implode(" ", $exts);
')"

rm -rf node_modules .env bootstrap/cache/*.php public/hot storage/logs/*.log
cd "$root"

echo "==> Committing to $target"
git fetch --quiet "$remote" "$target" 2>/dev/null || true
if git show-ref --verify --quiet "refs/heads/$target"; then
    git worktree add --quiet "$wt" "$target"
elif git show-ref --verify --quiet "refs/remotes/$remote/$target"; then
    git worktree add --quiet -b "$target" "$wt" "$remote/$target"
else
    git worktree add --quiet --orphan -b "$target" "$wt"
fi

cd "$wt"
git rm -rq --ignore-unmatch . >/dev/null
rsync -a --delete --exclude .git "$build/" "$wt/"
git add -A
# Ignored on source branches, required on the server.
git add -f vendor public/build
git commit --quiet -m "Release $sha" -m "Built from $(git -C "$root" rev-parse HEAD) with production dependencies."
echo "    $(git log --oneline -1)"

if $push; then
    git push --quiet "$remote" "$target"
    echo "==> Pushed $remote/$target. In cPanel: Git Version Control > Manage > Pull or Deploy > Update from Remote, then Deploy HEAD Commit."
else
    echo "==> Not pushed. Run: git push $remote $target"
fi

printf '\nServer needs PHP >= %s.%s.%s with extensions: %s\n' \
    "$((min_php / 10000))" "$((min_php / 100 % 100))" "$((min_php % 100))" "${exts:-see composer check-platform-reqs}"
