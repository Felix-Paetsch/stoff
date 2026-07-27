#!/usr/bin/env bash
set -uo pipefail

print_help() {
  cat <<'EOF'
Usage:
  ./watch.sh [options] "<command>"

Description:
  Watches included files and directories and reruns the command when matching
  files change.

Arguments:
  <command>
      The command to run when a change is detected.

Options:
  --help
      Show this help message and exit.

  --cooldown <seconds>
      Minimum number of seconds between command restarts.
      Default: 5

  --fileEndings <list>
      Comma-separated list of file endings to watch.
      Example: --fileEndings ts,js,json
      Default: js,json,ts

  --include <pattern>
      Include a file or directory pattern. Can be provided multiple times.
      Defaults to the current directory.
      Supports shell-style patterns such as:
        --include src
        --include "*.ts"
        --include "packages/*"

  --exclude <pattern>
      Exclude a file or directory pattern. Can be provided multiple times.
      Excludes take precedence over includes.
      Supports shell-style patterns such as:
        --exclude dist
        --exclude "*.js"
        --exclude "coverage/*"

Behavior:
  - The watched root directory is always the directory the script was called
    from.
  - The command is always executed from that same original directory.
  - Hidden files/directories and node_modules are always excluded.
  - By default, the complete current directory is included.
  - If --include is provided, only matching files and directories are watched.
  - Exclude patterns always take precedence over include patterns.
  - A running command is stopped and restarted when a new matching change is
    detected.

Examples:
  ./watch.sh "npm run build"
  ./watch.sh --cooldown 2 "npm run lint"
  ./watch.sh --fileEndings ts,tsx --exclude dist --exclude "*.js" "npm test"
  ./watch.sh --include src --include "packages/*" "npm test"
  ./watch.sh --include src --exclude "src/generated/*" "npm run build"
  ./watch.sh --fileEndings ts "npm run dev"
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
INCLUDES=()
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
    --include)
      if [[ $# -lt 2 ]]; then
        echo "Error: --include requires a value."
        exit 1
      fi

      INCLUDES+=("$2")
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

if ! command -v setsid >/dev/null 2>&1; then
  echo "Error: setsid is not installed."
  echo "It is usually provided by util-linux."
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

matches_pattern() {
  local rel="$1"
  local pattern="$2"
  local basename

  basename="$(basename "$rel")"

  if [[ "$rel" == $pattern ]] || [[ "$basename" == $pattern ]]; then
    return 0
  fi

  if [[ "$rel" == "$pattern"/* ]]; then
    return 0
  fi

  return 1
}

matches_exclude() {
  local path="$1"
  local rel
  local pattern

  rel="${path#$WATCH_DIR/}"

  case "$rel" in
    .* | */.*)
      return 0
      ;;
  esac

  case "$rel" in
    node_modules | node_modules/* | */node_modules | */node_modules/*)
      return 0
      ;;
  esac

  for pattern in "${EXCLUDES[@]}"; do
    if matches_pattern "$rel" "$pattern"; then
      return 0
    fi
  done

  return 1
}

matches_include() {
  local path="$1"
  local rel
  local pattern

  if [[ ${#INCLUDES[@]} -eq 0 ]]; then
    return 0
  fi

  rel="${path#$WATCH_DIR/}"

  for pattern in "${INCLUDES[@]}"; do
    if matches_pattern "$rel" "$pattern"; then
      return 0
    fi
  done

  return 1
}

build_inotify_exclude_regex() {
  local parts=()
  local pattern
  local regex
  local joined=""
  local part

  parts+=('(^|/)\..*')
  parts+=('(^|/)node_modules(/|$)')

  for pattern in "${EXCLUDES[@]}"; do
    regex="$(glob_to_regex "$pattern")"
    parts+=("(^|/)$regex($|/)")
  done

  for part in "${parts[@]}"; do
    if [[ -n "$joined" ]]; then
      joined+="|"
    fi

    joined+="$part"
  done

  printf '%s' "$joined"
}

last_run=0
current_pid=""
current_pgid=""

print_separator() {
  echo "============================================================"
}

stop_running_command() {
  local attempts=0

  if [[ -z "$current_pid" ]]; then
    return
  fi

  if ! kill -0 "$current_pid" 2>/dev/null; then
    wait "$current_pid" 2>/dev/null || true
    current_pid=""
    current_pgid=""
    return
  fi

  echo ""
  print_separator
  echo " 🛑 Stopping previous command (PID: $current_pid)..."
  print_separator

  # The command is launched through setsid, so its PID is also its process
  # group ID. This stops the command and its child processes together.
  kill -TERM -- "-$current_pgid" 2>/dev/null || true

  # Give the command up to one second to shut down cleanly.
  while kill -0 "$current_pid" 2>/dev/null && ((attempts < 10)); do
    sleep 0.1
    ((attempts++))
  done

  # Force-stop the process group if it did not exit cleanly.
  if kill -0 "$current_pid" 2>/dev/null; then
    echo " ⚠️  Previous command did not stop cleanly; sending SIGKILL."
    kill -KILL -- "-$current_pgid" 2>/dev/null || true
  fi

  wait "$current_pid" 2>/dev/null || true

  current_pid=""
  current_pgid=""
}

run_build() {
  local now
  local elapsed

  now=$(date +%s)
  elapsed=$((now - last_run))

  if ((elapsed < COOLDOWN)); then
    echo -n "F"
    return
  fi

  stop_running_command

  echo ""
  print_separator
  printf " 🔁 Change detected → running: %s\n" "$CMD"
  print_separator
  echo ""

  # setsid creates a separate process group for the command and all children.
  setsid bash -c '
    cd "$1" || exit 1

    eval "$2"
    exit_code=$?

    echo ""
    echo "============================================================"
    printf " ==== DONE ==== Exit code: %s\n" "$exit_code"
    echo "============================================================"

    exit "$exit_code"
  ' _ "$CALL_DIR" "$CMD" &

  current_pid=$!
  current_pgid=$current_pid
  last_run=$(date +%s)
}

cleanup() {
  trap - EXIT INT TERM

  echo ""
  echo "👋 Stopping watcher..."
  stop_running_command

  exit 0
}

trap cleanup EXIT INT TERM

INOTIFY_EXCLUDE_REGEX="$(build_inotify_exclude_regex)"

echo "📡 Watching '$WATCH_DIR' (cooldown: ${COOLDOWN}s)"
echo "▶ Running command: \"$CMD\""
echo "📄 File endings: $FILE_ENDINGS_CSV"
echo "🚫 Internal exclude regex: $INOTIFY_EXCLUDE_REGEX"

if [[ ${#INCLUDES[@]} -eq 0 ]]; then
  echo "✅ Includes: . (current directory)"
else
  printf "✅ Includes:"
  for pattern in "${INCLUDES[@]}"; do
    printf " %s" "$pattern"
  done
  printf "\n"
fi

if [[ ${#EXCLUDES[@]} -gt 0 ]]; then
  printf "🚫 Excludes:"
  for pattern in "${EXCLUDES[@]}"; do
    printf " %s" "$pattern"
  done
  printf "\n"
fi

run_build

while IFS= read -r changed_file; do
  if matches_exclude "$changed_file"; then
    continue
  fi

  if ! matches_include "$changed_file"; then
    continue
  fi

  if matches_watched_file "$changed_file"; then
    run_build
  fi
done < <(
  inotifywait -q -m -r \
    -e close_write \
    --exclude "$INOTIFY_EXCLUDE_REGEX" \
    "$WATCH_DIR" \
    --format '%w%f'
)
