#!/usr/bin/env bash
# Copies the latest version of each web app into static/apps/<name>/ so it's
# published as part of the website.
#
# Usage: ./scripts/sync-apps.sh
# Run it whenever you update one of the apps, then commit and push this repo.
set -euo pipefail

# folder under static/apps  ->  git repository, or a local folder (relative to this repo)
declare -A APPS=(
  [german-trainer]="git@github.com:mauricubo/german_teacher.git"
  [guitar-trainer]="git@github.com:mauricubo/guitar_trainer.git"
  # Not on GitHub yet: copied from the local folder. Files ignored by its .gitignore
  # (personal CVs: *.docx, *.pdf, *_data.json) are never copied.
  [cv-creator]="../cv_creator"
)

# Never published, whatever an app's .gitignore says: repo docs, personal documents, keys, env files.
SKIP='^(README\.md|\.gitignore|\.nojekyll|\.github/.*)$|\.(docx|pdf|env|pem|key|p12|pfx)$|_data\.json$|(^|/)id_(rsa|ed25519)'

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
TMP="$(mktemp -d)"
trap 'rm -rf "$TMP"' EXIT

for name in "${!APPS[@]}"; do
  source="${APPS[$name]}"
  echo "→ $name  ($source)"
  if [[ "$source" == git@* || "$source" == https://* ]]; then
    git clone --quiet --depth 1 "$source" "$TMP/$name"
    src="$TMP/$name"
    files="$(git -C "$src" ls-files)"
    version="$(git -C "$src" rev-parse --short HEAD)"
  else
    src="$(cd "$ROOT" && cd "$source" && pwd)"
    if git -C "$src" rev-parse --is-inside-work-tree >/dev/null 2>&1; then
      files="$(git -C "$src" ls-files)"
      version="$(git -C "$src" rev-parse --short HEAD)"
    else
      # Not a git repository: list files the way git would, honouring the app's .gitignore,
      # using a throwaway index so nothing is written into the app's folder.
      git init --quiet "$TMP/$name-index"
      files="$(git --git-dir="$TMP/$name-index/.git" --work-tree="$src" ls-files --others --exclude-standard)"
      version="$(cd "$src" && printf '%s\n' "$files" | sort | xargs -d '\n' sha1sum | sha1sum | cut -c1-7)"
    fi
  fi
  dest="$ROOT/static/apps/$name"
  rm -rf "$dest"
  mkdir -p "$dest"
  # Copy only what the app needs to run.
  printf '%s\n' "$files" | grep -vE "$SKIP" | while IFS= read -r f; do
    [ -n "$f" ] || continue
    mkdir -p "$dest/$(dirname "$f")"
    cp "$src/$f" "$dest/$f"
  done
  # Cache-busting: browsers may keep css/js for hours, so tag their links in index.html
  # and the imports between JavaScript modules with the app version; every sync then
  # loads the new files.
  if [ -f "$dest/index.html" ]; then
    sed -i -E "s#((href|src)=\"(css|js)/[^\"?]+\.(css|js))\"#\1?v=$version\"#g" "$dest/index.html"
  fi
  find "$dest" -name '*.js' -print0 | xargs -0 -r sed -i -E \
    -e "s#(from[[:space:]]*['\"]\.{1,2}/[^'\"?]+\.js)(['\"])#\1?v=$version\2#g" \
    -e "s#(import\([[:space:]]*['\"]\.{1,2}/[^'\"?]+\.js)(['\"])#\1?v=$version\2#g"
  echo "  copied $(find "$dest" -type f | wc -l) files, version $version"
done
