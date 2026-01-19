export const Times: Record<string, number> = {};
export const Calls: Record<string, number> = {};

export function add_calls_tracker<
    F extends (this: any, ...args: any[]) => any
>(fun: F, name: string): F {
    if (!Calls[name]) {
        Calls[name] = 0;
    }

    return function (this: any, ...args: any[]) {
        Calls[name] += 1;
        return fun.apply(this, args);
    } as F;
}

export function add_time_tracker<
    F extends (this: any, ...args: any[]) => any
>(fun: F, name: string): F {
    if (!Times[name]) {
        Times[name] = 0;
    }

    return function (this: any, ...args: any[]) {
        const start = Date.now();
        const result = fun.apply(this, args);
        const end = Date.now();

        Times[name] += end - start;
        return result;
    } as F;
}

export function add_tracker<
    F extends (this: any, ...args: any[]) => any
>(fun: F, name: string): F {
    return add_calls_tracker(
        add_time_tracker(fun, name),
        name
    );
}

export function reset(): void {
    for (const key in Times) {
        Times[key] = 0;
    }
    for (const key in Calls) {
        Calls[key] = 0;
    }
}
