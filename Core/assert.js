import CONF from './StoffLib/config.json' with {type: "json"};

const assert = (bool, error) => {
    if (!bool){
        if (CONF.fail_on_asserts){
            throw new Error(error);
        } else {
            console.warn("ASSERT CHECK NOT PASSED: ", error);
            console.warn("========================");
            console.warn((new Error(error)).trace);
            return false;
        }
    }
    return true;
}

assert.register_assert = function register_assert(ident, error_msg, method, priority = 0){
    const fun = (...args) => {
        if (
            !CONF.execute_internal_custom_assert || (
                typeof CONF.execute_internal_custom_assert == "number" && priority < CONF.execute_internal_custom_assert
            )
        ) return null;
        const res = method(...args);
        if (res === true || typeof res === "undefined") return;
        let custom_msg = error_msg
        if (typeof res !== "boolean") custom_msg = res;
        
        const error = `ASSERT.${ident} failed: ` + custom_msg
        if (CONF.fail_on_asserts){
            throw new Error(error);
        } else {
            console.warn(error);
            console.warn("========================");
            console.warn((new Error(error)).trace);
            return;
        }
    };
    assert[ident] = fun;
}

assert.register_method = function register_method(ident, fun){
    assert[ident] = fun;
}

let uninitialized = true;
assert.mark_initialized = function(){
    uninitialized = false;
    delete assert.mark_initialized;
}

const proxiedAssert = new Proxy(assert, {
    get(target, prop) {
        if (uninitialized === true) return target[prop] || (() => { return true; });
        if (typeof target[prop] === 'function') {
            return target[prop];
        }
        throw new Error(`Assert method ${prop} not found!`);
    }
});

export default proxiedAssert;