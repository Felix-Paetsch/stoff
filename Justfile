mod standalone 'Dev/StandAlone/Justfile'
mod test 'Dev/Test/Justfile'
mod tools 'Tools/Justfile'

typecheck:
    ./watch.sh "npx tsc -p tsconfig.json --noEmit"

dev_typecheck:
    ./watch.sh "npx tsc -p dev_tsconfig.json --noEmit"

check_circular_dependencies:
    npx madge --circular --extensions ts .

build:
    cd Rust && wasm-pack build --target nodejs --release

dev_build:
    cd Rust && cargo clippy -- -D warnings && wasm-pack build --target nodejs --dev

watch-server:
    cd Dev/Server && npm run start

sewing:
    ./watch.sh "npx tsx ./Sewing/Patterns/index.ts"

embroidery:
    ./watch.sh "npx tsx ./Embroidery/index.ts"

