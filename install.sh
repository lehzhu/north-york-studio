#!/bin/sh
set -eu

BASE_URL="${BASE_URL:-https://terry.northyorkstudio.com}"
TARGET="${1:-all}"

usage() {
  echo "usage: sh install.sh [all|codex|claude]" >&2
  exit 1
}

need() {
  command -v "$1" >/dev/null 2>&1 || {
    echo "missing required command: $1" >&2
    exit 1
  }
}

download() {
  url="$1"
  path="$2"
  mkdir -p "$(dirname "$path")"
  curl -fsSL "$url" -o "$path"
}

install_codex() {
  root="${CODEX_HOME:-$HOME/.codex}/skills/terry-roast"
  download "$BASE_URL/downloads/codex/terry-roast/SKILL.md" "$root/SKILL.md"
  download "$BASE_URL/downloads/codex/terry-roast/agents/openai.yaml" "$root/agents/openai.yaml"
  download "$BASE_URL/downloads/codex/terry-roast/references/voice-and-guardrails.md" "$root/references/voice-and-guardrails.md"
  download "$BASE_URL/downloads/codex/terry-roast/scripts/repo_snapshot.sh" "$root/scripts/repo_snapshot.sh"
  chmod +x "$root/scripts/repo_snapshot.sh"
  echo "Installed Codex skill: $root"
}

install_claude() {
  root="$HOME/.claude/skills/terry-roast"
  download "$BASE_URL/downloads/claude/skills/terry-roast/SKILL.md" "$root/SKILL.md"
  echo "Installed Claude Code skill: $root/SKILL.md"
}

need curl

case "$TARGET" in
  all)
    install_codex
    install_claude
    ;;
  codex)
    install_codex
    ;;
  claude)
    install_claude
    ;;
  *)
    usage
    ;;
esac

cat <<EOF

Invocation examples:
  Codex:  Use \$terry-roast on this repo at medium heat. Cite files and end with the three most fixable sins.
  Claude: Restart Claude Code if needed, then ask "Roast this repo at medium heat"
EOF
