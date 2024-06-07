import CONF from '../config.json' assert { type: 'json' };
const error_margin = CONF.VAL_ERROR_MARGIN;

function approx_eq(a,b = 0){
    return Math.abs(a-b) < error_margin
}

function assert(bool, error){
    if (!bool){
        throw new Error(error);
    }
    return true;
}
function try_with_error_msg(f, msg) {
    try {
        f();
    } catch (e) {
        console.log("=== An Error occurred ===");
        console.log(msg);
        console.log("=== Original error msg: ===");
        throw e; // Re-throwing the error is optional, depends on how you want to handle it
    }
}

export {
    assert,
    approx_eq,
    try_with_error_msg
};