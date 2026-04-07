dev-run *ARGS:
    npx tsx ./Dev/Debug/index.ts {{ARGS}}

dev-watch *ARGS:
    ./watch.sh "npx tsx ./Dev/Debug/index.ts {{ARGS}}"

dev-typecheck:
    ./watch.sh "npx tsc -p tsconfig.json --noEmit"

dev-output:
    nsxiv -a /home/Felix/work/Stoff/Dev/Debug/output/scene.png &

build:
    cd Core/rust && wasm-pack build --target web
