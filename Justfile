mod rust 'Rust/Justfile'
mod python 'Python/server/Justfile'

mod standalone 'StandAlone/Justfile'

mod test 'Dev/Test/Justfile'
mod tools 'Tools/Justfile'

watch-server:
    cd Dev/Server && npm run start

typecheck:
    ./watch.sh "npx tsc -p tsconfig.json --noEmit"

dev_typecheck:
    ./watch.sh "npx tsc -p dev_tsconfig.json --noEmit"

sewing:
    ./watch.sh "npx tsx ./Sewing/Patterns/index.ts"
