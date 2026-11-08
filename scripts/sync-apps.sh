#!/usr/bin/env bash
# Copies the latest version of each web app from its GitHub repository into
# static/apps/<name>/ so it's published as part of the website.
#
# Usage: ./scripts/sync-apps.sh
# Run it whenever you update one of the apps, then commit and push this repo.
set -euo pipefail

# folder under static/apps  ->  git repository
declare -A APPS=(
  [german-trainer]="git@github.com:mauricubo/german_teacher.git"
  [guitar-trainer]="git@github.com:mauricubo/guitar_trainer.git"
)

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
TMP="$(mktemp -d)"
trap 'rm -rf "$TMP"' EXIT

for name in "${!APPS[@]}"; do
  repo="${APPS[$name]}"
  echo "→ $name  ($repo)"
  git clone --quiet --depth 1 "$repo" "$TMP/$name"
  dest="$ROOT/static/apps/$name"
  rm -rf "$dest"
  mkdir -p "$dest"
  # Copy only what the app needs to run: no git metadata or repo docs.
  (cd "$TMP/$name" && git ls-files) \
    | grep -vE '^(README\.md|\.gitignore|\.nojekyll|\.github/.*)$' \
    | while IFS= read -r f; do
        mkdir -p "$dest/$(dirname "$f")"
        cp "$TMP/$name/$f" "$dest/$f"
      done
  # Cache-busting: browsers may keep css/js for hours, so tag their links in
  # index.html with the app version; every sync then loads the new files.
  version="$(git -C "$TMP/$name" rev-parse --short HEAD)"
  if [ -f "$dest/index.html" ]; then
    sed -i -E "s#((href|src)=\"(css|js)/[^\"?]+\.(css|js))\"#\1?v=$version\"#g" "$dest/index.html"
  fi
  echo "  copied $(find "$dest" -type f | wc -l) files, version $version"
done
