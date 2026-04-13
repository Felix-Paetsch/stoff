build:
    npx tsx ./build_tests.ts

update:
    echo "Updating the test cases now."

    rm -rf reference_output
    mkdir reference_output
    cp -r test_output/* reference_output/

run:
    #!/bin/bash -i
    just --justfile test.just build
    mamba activate stoff
    python compare_tests.py

watch:
    #!/bin/bash -i
    cd ../../
    ./watch.sh "just test::run" 

similarity:
    ../../watch.sh --fileEndings py "python python/image_similarity.py"

