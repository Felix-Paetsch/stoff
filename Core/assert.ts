import CONF from "./StoffLib/config.json" with { type: "json" };

export type ValidationResult = boolean | string | null | undefined | void
export type ValidationFunction = () => ValidationResult;

export const assert = (bool: ValidationResult | ValidationFunction, error: string = "Assert Failed"): boolean => {
    if (typeof bool == "string") {
        return assert(false, bool);
    }

    if (bool === false) {
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

export function validation_failed(v: ValidationResult) {
    return v === false;
}


export function merge_validations(fns: (ValidationFunction | ValidationResult)[]): ValidationResult {
    for (let f of fns) {
        let res: ValidationResult;
        if (typeof f == "function") {
            res = f();
        } else {
            res = f;
        }

        if (validation_failed(res)) {
            return res;
        }
    }

    return true;
}
