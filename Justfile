mod standalone 'Dev/StandAlone/Justfile'
mod test 'Dev/Test/Justfile'
mod tools 'Tools/Justfile'
mod embroidery 'Embroidery/Justfile'

typecheck:
    ./watch.sh "npx tsc -p tsconfig.json --noEmit"

build:
    cd Core/rust && wasm-pack build --target nodejs

watch-server:
    cd Dev/Server && npm run start

sewing:
    ./watch.sh "npx tsx ./Sewing/Patterns/index.ts"

