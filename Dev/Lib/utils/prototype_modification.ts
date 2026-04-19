export type ToggleState = "on" | "off";
export type Toggle = (to?: ToggleState) => ToggleState;
export type EvaluationResult = { _res: true };

export type MethodName<T> = {
    [K in keyof T]: T[K] extends (...args: any[]) => any ? K : never;
}[keyof T];

export function wrap_object_methods<S extends {}>(
    s: S,
    method: (
        evaluate: () => EvaluationResult,
        s: S,
        fn_name: string,
        args: any[],
    ) => EvaluationResult,
    wrap_on: (MethodName<S> & string)[],
): Toggle {
    let switched: ToggleState = "on";

    wrap_on.forEach((methodName) => {
        const originalMethod: any = s[methodName];
        (s as any)[methodName] = function (...args: any[]) {
            if (switched) {
                return method(
                    () => originalMethod.apply(s, args),
                    s,
                    methodName,
                    args,
                );
            }

            return originalMethod.apply(this, args);
        };
    });

    return (to: ToggleState | null = null) => {
        if (to === null) {
            switched = switched == "on" ? "off" : "on";
        } else {
            switched = to;
        }
        return switched;
    };
}

export function wrap_class_prototype_methods<S>(
    s: new (...args: any[]) => S,
    method: (
        evaluate: () => EvaluationResult,
        s: S,
        fn_name: string,
        args: any[],
    ) => EvaluationResult,
    wrap_on: (MethodName<S> & string)[],
): Toggle {
    let switched: ToggleState = "on";

    wrap_on.forEach((methodName) => {
        const originalMethod = s.prototype[methodName];
        s.prototype[methodName] = function (...args: any[]) {
            if (switched) {
                const t = this;
                return method(
                    () => originalMethod.apply(t, args),
                    t,
                    methodName,
                    args,
                );
            }

            return originalMethod.apply(this, args);
        };
    });

    return (to: ToggleState | null = null) => {
        if (to === null) {
            switched = switched == "on" ? "off" : "on";
        } else {
            switched = to;
        }
        return switched;
    };
}
