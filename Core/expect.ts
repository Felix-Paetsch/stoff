export type ValidationResult = boolean | string | null | undefined | void;
export type ValidationFunction = () => ValidationResult;

export const that = (
    bool: ValidationResult | ValidationFunction,
    error: string = "Assert Failed",
): boolean => {
    if (typeof bool == "string") {
        return that(false, bool);
    }

    if (bool === false) {
        throw new Error(error);
    }
    return true;
};

export function defined<T>(
    value: T,
    error: string = "Value is not defined",
): Exclude<T, undefined> {
    if (value === undefined) throw new Error(error);
    return value as Exclude<T, undefined>;
}

type Falsy = false | 0 | 0n | "" | null | undefined;
export function truthy<T>(
    value: T,
    error: string = "Value is not truthy",
): Exclude<T, Falsy> {
    if (!Boolean(value)) throw new Error(error);
    return value as Exclude<T, Falsy>;
}

export function invalid_path(str = "Invalid path reached!") {
    return that(str);
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
