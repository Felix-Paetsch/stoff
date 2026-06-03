
type UnwrapSingle<T> = T extends [infer U] ? U : T;

export type AnyPossibleArray<Options> = Options extends any
    ? UnwrapSingle<Options>[]
    : never;

export type AnyReturnTypeFunction<
    Args extends any[],
    ReturnTypeOptions,
> = ReturnTypeOptions extends any
    ? (...args: Args) => UnwrapSingle<ReturnTypeOptions>
    : never;
