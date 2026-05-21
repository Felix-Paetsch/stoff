export type And<
    A extends boolean = true,
    B extends boolean = true,
    C extends boolean = true,
    D extends boolean = true,
    E extends boolean = true,
    F extends boolean = true,
    G extends boolean = true,
    H extends boolean = true,
> = A extends true
    ? B extends true
        ? C extends true
            ? D extends true
                ? E extends true
                    ? F extends true
                        ? G extends true
                            ? H extends true
                                ? true
                                : false
                            : false
                        : false
                    : false
                : false
            : false
        : false
    : false;

export type Or<
    A extends boolean = false,
    B extends boolean = false,
    C extends boolean = false,
    D extends boolean = false,
    E extends boolean = false,
    F extends boolean = false,
    G extends boolean = false,
    H extends boolean = false,
> = A extends false
    ? B extends false
        ? C extends false
            ? D extends false
                ? E extends false
                    ? F extends false
                        ? G extends false
                            ? H extends false
                                ? false
                                : true
                            : true
                        : true
                    : true
                : true
            : true
        : true
    : true;

export type Not<A extends boolean> = A extends true ? false : true;
export type Xor<A extends boolean, B extends boolean> = And<
    Or<A, B>,
    Not<And<A, B>>
>;
