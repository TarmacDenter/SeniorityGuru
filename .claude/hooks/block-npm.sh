#!/bin/bash
# Block npm usage in Claude Code Bash tool — use pnpm instead.
# Reads the tool input JSON from stdin, extracts the command field,
# and blocks any command that invokes npm (not npx) as a standalone word.

INPUT=$(cat)
CMD=$(echo "$INPUT" | jq -r '.command // empty' 2>/dev/null)

if [ -n "$CMD" ] && echo "$CMD" | grep -qE '\bnpm '; then
  echo '{"decision":"block","reason":"Use pnpm instead of npm. Equivalents: npm install → pnpm install | npm run <cmd> → pnpm <cmd> | npm test → pnpm test | npm ci → pnpm install --frozen-lockfile"}'
  exit 0
fi
