import CONF from "./StoffLib/config.json" with { type: "json" };

const assert = (bool: boolean, error: string) => {
    if (!bool) {
        if (CONF.fail_on_asserts) {
            throw new Error(error);
        } else {
            console.warn("ASSERT CHECK NOT PASSED: ", error);
            console.warn("========================");
            console.warn(new Error(error).stack);
            return false;
        }
    }
    return true;
};

export default assert;
