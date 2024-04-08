export default function assert(bool, err = "Assertion failed"){
    if (bool instanceof Boolean && !bool){
        throw new Error(err);
    } else {
        for (const b in bool){
            assert(b, err);
        }
    }
}