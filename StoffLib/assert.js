import CONF from './config.json' assert { type: 'json' };
import register_asserts from "./assert_methods/register.js";

let asserts_registered = false;
const assert = (bool, error) => {
    if (!asserts_registered){
        asserts_registered = true;
        register_asserts(dev_assert);
    }

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

const proxiedAssert = new Proxy(assert, {
    get(target, prop) {
        if (!asserts_registered) {
            asserts_registered = true;
            register_asserts(dev_assert);
        }
        if (typeof target[prop] === 'function') {
            return (...args) => target[prop](...args);
        }
        throw new Error(`Assert method ${prop} not found!`);
    }
});

const dev_assert = {
    register_assert: function register_assert(ident, error_msg, method, priority = 0){
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
                return false;
            }
        };
        assert[ident] = fun;
        dev_assert[ident] = fun;
    },
    register_method: function register_method(ident, fun){
        assert[ident] = fun;
        dev_assert[ident] = fun;
    },
    assert_obj: () => { return assert; }
}

export default proxiedAssert;