dev-run *ARGS:
    npx tsx ./Dev/Debug/index.ts {{ARGS}}

dev-watch *ARGS:
    ./watch.sh --cooldown 1 --exclude "./Dev/Server/watch" "npx tsx ./Dev/StandAlone/index.ts {{ARGS}}"

dev-typecheck:
    ./watch.sh "npx tsc -p tsconfig.json --noEmit"

dev-output:
    nsxiv -a /home/Felix/work/Stoff/Dev/Debug/output/scene.png &

build:
    cd Core/rust && wasm-pack build --target nodejs

watch-server:
    cd Dev/Server && npm run start
