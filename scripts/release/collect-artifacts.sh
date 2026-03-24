#!/usr/bin/env bash
set -euo pipefail

ROOT="${1:-release-artifacts}"
mkdir -p "$ROOT"

mapfile -t FILES < <(find src-tauri/target/release/bundle -type f \( \
  -name '*.dmg' -o \
  -name '*.app.tar.gz' -o \
  -name '*.msi' -o \
  -name '*.exe' -o \
  -name '*.AppImage' -o \
  -name '*.deb' -o \
  -name '*.rpm' \) 2>/dev/null | sort)

if [[ ${#FILES[@]} -eq 0 ]]; then
  echo "No release artifacts found under src-tauri/target/release/bundle" >&2
  exit 1
fi

for file in "${FILES[@]}"; do
  cp "$file" "$ROOT/"
done

(
  cd "$ROOT"
  shasum -a 256 * > SHA256SUMS.txt
)

echo "Collected ${#FILES[@]} release artifact(s) into $ROOT"
