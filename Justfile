dev-run *ARGS:
    npx tsx ./Dev/Debug/index.ts {{ARGS}}

dev-watch *ARGS:
    ./watch.sh "npx tsx ./Dev/Debug/index.ts {{ARGS}}"

dev-typecheck:
    npm npx tsc -p tsconfig.json --noEmit

dev-typecheck-watch:
    ./watch.sh "npx tsc -p tsconfig.json --noEmit"
