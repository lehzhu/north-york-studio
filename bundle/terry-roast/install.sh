#!/bin/sh
set -eu

SCRIPT_DIR=$(CDPATH= cd -- "$(dirname -- "$0")" && pwd)
CODEX_ROOT="${CODEX_HOME:-$HOME/.codex}/skills/terry-roast"
CLAUDE_ROOT="$HOME/.claude/skills/terry-roast"

mkdir -p "$CODEX_ROOT/agents" "$CODEX_ROOT/references" "$CODEX_ROOT/scripts" "$CLAUDE_ROOT"

cp "$SCRIPT_DIR/codex/terry-roast/SKILL.md" "$CODEX_ROOT/SKILL.md"
cp "$SCRIPT_DIR/codex/terry-roast/agents/openai.yaml" "$CODEX_ROOT/agents/openai.yaml"
cp "$SCRIPT_DIR/codex/terry-roast/references/voice-and-guardrails.md" "$CODEX_ROOT/references/voice-and-guardrails.md"
cp "$SCRIPT_DIR/codex/terry-roast/scripts/repo_snapshot.sh" "$CODEX_ROOT/scripts/repo_snapshot.sh"
cp "$SCRIPT_DIR/claude/skills/terry-roast/SKILL.md" "$CLAUDE_ROOT/SKILL.md"

chmod +x "$CODEX_ROOT/scripts/repo_snapshot.sh"

cat <<EOF
Installed Terry Roast locally.

Codex:
  Use \$terry-roast on this repo at medium heat. Cite files and end with the three most fixable sins.

Claude Code:
  Restart Claude Code if needed, then ask:
    Roast this repo at medium heat
EOF
