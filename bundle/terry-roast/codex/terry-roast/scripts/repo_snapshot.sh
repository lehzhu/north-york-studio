#!/usr/bin/env bash
set -euo pipefail

max_files=200

while [[ $# -gt 0 ]]; do
  case "$1" in
    --max-files)
      max_files="${2:-}"
      shift 2
      ;;
    *)
      echo "usage: $0 [--max-files N]" >&2
      exit 1
      ;;
  esac
done

case "$max_files" in
  ''|*[!0-9]*)
    echo "--max-files must be a positive integer" >&2
    exit 1
    ;;
esac

if ! command -v rg >/dev/null 2>&1; then
  echo "ripgrep (rg) is required" >&2
  exit 1
fi

print_section() {
  printf '\n## %s\n' "$1"
}

repo_files() {
  rg --files \
    -g '!**/.git/**' \
    -g '!node_modules/**' \
    -g '!dist/**' \
    -g '!build/**' \
    -g '!coverage/**' \
    -g '!out/**' \
    -g '!target/**' \
    -g '!vendor/**'
}

total_files="$(repo_files | wc -l | tr -d ' ')"

print_section "Repository"
printf 'root: %s\n' "$PWD"
printf 'files: %s\n' "$total_files"

print_section "Manifests"
repo_files | rg '(^|/)(package\.json|pnpm-workspace\.yaml|yarn\.lock|bun\.lockb|tsconfig\.json|pyproject\.toml|requirements\.txt|Cargo\.toml|go\.mod|Gemfile|composer\.json|pom\.xml|Makefile|justfile|Dockerfile|docker-compose\.ya?ml)$' || true

print_section "Top extensions"
repo_files \
  | awk -F. 'NF > 1 { ext=tolower($NF); counts[ext]++ } END { for (ext in counts) printf "%7d %s\n", counts[ext], ext }' \
  | sort -rn \
  | head -n 12

print_section "Representative files"
repo_files | head -n "$max_files"

print_section "Test and lint clues"
repo_files | rg '(^|/)(package\.json|pyproject\.toml|Cargo\.toml|go\.mod|Makefile|justfile|tox\.ini|pytest\.ini|vitest\.config\..*|jest\.config\..*|eslint\.config\..*|\.eslintrc.*|ruff\.toml)$' || true

print_section "Code smell markers"
rg -n -S \
  --glob '!**/.git/**' \
  --glob '!node_modules/**' \
  --glob '!dist/**' \
  --glob '!build/**' \
  --glob '!coverage/**' \
  '(TODO|FIXME|HACK|XXX|@ts-ignore|eslint-disable|panic\(|console\.log\()' \
  | head -n 40 || true
