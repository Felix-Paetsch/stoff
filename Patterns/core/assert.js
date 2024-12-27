import CONF from './config.json' assert { type: 'json' };
import register_assert from "./assert_methods/register.js";

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

assert.register_check = (ident, error_msg, method, priority = 0) => {
    assert[ident] = (...args) => {
        if (
            !CONF.execute_custom_assert || (
                typeof CONF.execute_custom_assert == "number" && priority < CONF.execute_custom_assert
            )
        ) return null;
        const res = method(...args);
        if (res === true) return;
        let custom_msg = error_msg
        if (typeof res !== "boolean") custom_msg = res;
        
        const error = `ASSERT.${ident} failed: ` + custom_msg
        if (CONF.fail_on_asserts){
            throw new Error(error);
        } else {
            console.warn(error);
            console.warn("========================");
            console.warn((new Error(error)).trace);
            return false;
        }
    };
}

register_assert(assert);
export default assert;