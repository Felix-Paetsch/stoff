mod standalone 'Dev/StandAlone/Justfile'
mod test 'Dev/Test/Justfile'
mod tools 'Tools/Justfile'
mod embroidery 'Embroidery/Justfile'

typecheck:
    ./watch.sh "npx tsc -p tsconfig.json --noEmit"

check_circular_dependencies:
    npx madge --circular --extensions ts .

build:
    cd Core/rust && wasm-pack build --target nodejs

watch-server:
    cd Dev/Server && npm run start

sewing:
    ./watch.sh "npx tsx ./Sewing/Patterns/index.ts"

