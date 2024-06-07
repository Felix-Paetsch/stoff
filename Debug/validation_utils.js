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
    try_with_error_msg
};