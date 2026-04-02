#!/usr/bin/env bash
set -uo pipefail

print_help() {
  cat <<'EOF'
Usage:
  ./watch-and-build.sh [options] "<command>"

Description:
  Watches the directory the script was called from and reruns the command when
  matching files change.

Arguments:
  <command>
      The command to run when a change is detected.

Options:
  --help
      Show this help message and exit.

  --cooldown <seconds>
      Minimum number of seconds between command runs.
      Default: 5

  --fileEndings <list>
      Comma-separated list of file endings to watch.
      Example: --fileEndings ts,js,json
      Default: js,json,ts

  --exclude <pattern>
      Exclude a file or directory pattern. Can be provided multiple times.
      Supports shell-style patterns such as:
        --exclude dist
        --exclude "*.js"
        --exclude "coverage/*"

Behavior:
  - The watched root directory is always the directory the script was called
    from.
  - The command is always executed from that same original directory.
  - Hidden files/directories and node_modules are always excluded.

Examples:
  ./watch-and-build.sh "npm run build"
  ./watch-and-build.sh --cooldown 2 "npm run lint"
  ./watch-and-build.sh --fileEndings ts,tsx --exclude dist --exclude "*.js" "npm test"
EOF
}

escape_regex() {
  printf '%s' "$1" | sed 's/[][(){}.^$+?|\\]/\\&/g'
}

glob_to_regex() {
  local pattern="$1"
  pattern="$(escape_regex "$pattern")"
  pattern="${pattern//\*/.*}"
  pattern="${pattern//\?/.}"
  printf '%s' "$pattern"
}

CALL_DIR="$(pwd)"
WATCH_DIR="$CALL_DIR"
COOLDOWN=5
FILE_ENDINGS_CSV="js,json,ts"
CMD=""
EXCLUDES=()

while [[ $# -gt 0 ]]; do
  case "$1" in
    --help)
      print_help
      exit 0
      ;;
    --cooldown)
      if [[ $# -lt 2 ]]; then
        echo "Error: --cooldown requires a value."
        exit 1
      fi
      COOLDOWN="$2"
      shift 2
      ;;
    --fileEndings)
      if [[ $# -lt 2 ]]; then
        echo "Error: --fileEndings requires a value."
        exit 1
      fi
      FILE_ENDINGS_CSV="$2"
      shift 2
      ;;
    --exclude)
      if [[ $# -lt 2 ]]; then
        echo "Error: --exclude requires a value."
        exit 1
      fi
      EXCLUDES+=("$2")
      shift 2
      ;;
    --*)
      echo "Error: Unknown option: $1"
      echo "Use --help for usage."
      exit 1
      ;;
    *)
      if [[ -n "$CMD" ]]; then
        echo "Error: Multiple commands provided."
        echo "Use --help for usage."
        exit 1
      fi
      CMD="$1"
      shift
      ;;
  esac
done

if [[ -z "$CMD" ]]; then
  echo "Error: Missing command."
  echo "Use --help for usage."
  exit 1
fi

if ! [[ "$COOLDOWN" =~ ^[0-9]+$ ]]; then
  echo "Error: --cooldown must be a non-negative integer."
  exit 1
fi

if ! command -v inotifywait >/dev/null 2>&1; then
  echo "Error: inotifywait is not installed."
  echo "Install it with: sudo pacman -S inotify-tools"
  exit 1
fi

IFS=',' read -r -a FILE_ENDINGS <<<"$FILE_ENDINGS_CSV"

if [[ ${#FILE_ENDINGS[@]} -eq 0 ]]; then
  echo "Error: --fileEndings must not be empty."
  exit 1
fi

matches_watched_file() {
  local file="$1"
  local ending

  for ending in "${FILE_ENDINGS[@]}"; do
    ending="${ending//[[:space:]]/}"
    [[ -z "$ending" ]] && continue
    if [[ "$file" == *."$ending" ]]; then
      return 0
    fi
  done

  return 1
}

matches_exclude() {
  local path="$1"
  local rel pattern

  rel="${path#$WATCH_DIR/}"

  case "$rel" in
    .*|*/.*)
      return 0
      ;;
  esac

  case "$rel" in
    node_modules|node_modules/*|*/node_modules|*/node_modules/*)
      return 0
      ;;
  esac

  for pattern in "${EXCLUDES[@]}"; do
    if [[ "$rel" == $pattern ]] || [[ "$(basename "$rel")" == $pattern ]]; then
      return 0
    fi
  done

  return 1
}

build_inotify_exclude_regex() {
  local parts=()
  local pattern
  local regex

  parts+=('(^|/)\..*')
  parts+=('(^|/)node_modules(/|$)')

  for pattern in "${EXCLUDES[@]}"; do
    regex="$(glob_to_regex "$pattern")"

    if [[ "$pattern" == */* ]]; then
      parts+=("(^|/)$regex($|/)")
    else
      parts+=("(^|/)$regex($|/)")
    fi
  done

  local joined=""
  local part
  for part in "${parts[@]}"; do
    if [[ -n "$joined" ]]; then
      joined+="|"
    fi
    joined+="$part"
  done

  printf '%s' "$joined"
}

last_run=0

run_build() {
  local now elapsed
  now=$(date +%s)
  elapsed=$((now - last_run))

  if (( elapsed < COOLDOWN )); then
    echo -n "F"
    return
  fi

  (
    printf "\n 🔁 Change detected → running: %s" "$CMD"
    cd "$CALL_DIR" || exit 1
    echo ""
    echo ""
    eval "$CMD"
    echo ""
    echo -n "==== DONE ==== "
  )

  last_run=$(date +%s)
}

INOTIFY_EXCLUDE_REGEX="$(build_inotify_exclude_regex)"

echo "📡 Watching '$WATCH_DIR' (cooldown: ${COOLDOWN}s)"
echo "▶ Running command: \"$CMD\""
echo "📄 File endings: $FILE_ENDINGS_CSV"
echo "🚫 Internal exclude regex: $INOTIFY_EXCLUDE_REGEX"

if [[ ${#EXCLUDES[@]} -gt 0 ]]; then
  printf "🚫 Excludes:"
  for pattern in "${EXCLUDES[@]}"; do
    printf " %s" "$pattern"
  done
  printf "\n"
fi

run_build

inotifywait -q -m -r \
  -e close_write \
  --exclude "$INOTIFY_EXCLUDE_REGEX" \
  "$WATCH_DIR" \
  --format '%w%f' |
while read -r changed_file; do
  if matches_exclude "$changed_file"; then
    continue
  fi

  if matches_watched_file "$changed_file"; then
    run_build
  fi
done
