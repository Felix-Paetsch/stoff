mod standalone 'Dev/StandAlone/standalone.just'
mod test 'Dev/Test/test.just'

typecheck:
    ./watch.sh "npx tsc -p tsconfig.json --noEmit"

build:
    cd Core/rust && wasm-pack build --target nodejs

watch-server:
    cd Dev/Server && npm run start

sewing:
    ./watch.sh "npx tsx ./Sewing/Patterns/index.ts"
