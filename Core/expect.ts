export type ValidationResult = boolean | string | null | undefined | void;
export type ValidationFunction = () => ValidationResult;

export const expect = (
    bool: ValidationResult | ValidationFunction,
    error: string = "Assert Failed",
): boolean => {
    if (typeof bool == "string") {
        return expect(false, bool);
    }

    if (bool === false) {
        throw new Error(error);
    }
    return true;
};

export function invalid_path(str = "Invalid path reached!") {
    return str;
}

export function validation_failed(v: ValidationResult) {
    return v === false || typeof v == "string";
}

export function merge_validations(
    fns: (ValidationFunction | ValidationResult)[],
    failure_text: string | null = null,
): ValidationResult {
    for (let f of fns) {
        let res: ValidationResult;
        if (typeof f == "function") {
            res = f();
        } else {
            res = f;
        }

        if (validation_failed(res)) {
            return failure_text || res;
        }
    }

    return true;
}
