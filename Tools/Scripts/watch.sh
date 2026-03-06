#!/usr/bin/env bash
set -uo pipefail

# ----------------------------------------
# USAGE
# ----------------------------------------
# ./scripts/watch-and-build.sh "<npm_command>" [cooldown_seconds]
#
# Example:
#   ./scripts/watch-and-build.sh "npm run build:watch" 1
#   ./scripts/watch-and-build.sh "npm run lint" 2
#
# Default cooldown: 1 second
# ----------------------------------------

if [ $# -lt 1 ]; then
  echo "Usage: $0 \"<npm_command>\" [cooldown_seconds]"
  exit 1
fi

CMD="$1"
COOLDOWN="${2:-1}"

# ----------------------------------------
# Resolve script directory and project root
# ----------------------------------------

CALL_DIR="$(pwd)"

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"

WATCH_DIR="$PROJECT_ROOT"

cd "$PROJECT_ROOT"

last_run=0

run_build() {
  local now elapsed
  now=$(date +%s)
  elapsed=$(( now - last_run ))

  if (( elapsed < COOLDOWN )); then
    # Swallow event
    echo -n "F"
    return
  fi

  (
     printf "\n 🔁 Change detected → running: $CMD"
     cd "$CALL_DIR"
     eval "$CMD"
     echo -n "==== DONE ==== "
  )

   last_run=$(date +%s)
}

# Check tool availability
if ! command -v inotifywait >/dev/null 2>&1; then
  echo "Error: inotifywait is not installed."
  echo "Install it with: sudo pacman -S inotify-tools"
  exit 1
fi

echo "📡 Watching '$WATCH_DIR' (cooldown: ${COOLDOWN}s)"
echo "▶ Running command: \"$CMD\""

run_build

inotifywait -q -m -r \
  -e close_write \
  "$WATCH_DIR" \
  --format '%w%f' |
while read -r changed_file; do
  case "$changed_file" in
    *.ts|*.js|*.json|*.tsx|*.jsx)
      run_build
      ;;
  esac
done


# inotifywait -q -m -r \
#   -e modify,create,delete,move \
#   "$WATCH_DIR" \
#   --format '%w%f' |
# while read -r changed_file; do
#   case "$changed_file" in
#     *.ts|*.js|*.json|*.tsx|*.jsx)
#       run_build
#       ;;
#   esac
# done
