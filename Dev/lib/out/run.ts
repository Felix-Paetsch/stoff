import { put, put_live_recordings } from "./put";

export function run_wrapped<T, Args extends any[] = []>(
    fn: (...args: Args) => T,
    ...args: Args
): T {
    try {
        return fn(...args);
    } catch (e: any) {
        if (e instanceof Error) {
            put(e, {
                title: "#Programm Error",
                prefix: false,
            });
        } else {
            put(typeof e, {
                title: "#Programm Error",
                prefix: false,
            });
        }
        throw e;
    } finally {
        put_live_recordings();
    }
}

export async function run_async_wrapped<T, Args extends any[] = []>(
    fn: (...args: Args) => Promise<T>,
    ...args: Args
): Promise<T> {
    try {
        const r = await fn(...args);
        return r;
    } catch (e: any) {
        if (e instanceof Error) {
            put(e, {
                title: "#Programm Error",
                prefix: false,
            });
        } else {
            put(typeof e, {
                title: "#Programm Error",
                prefix: false,
            });
        }
        throw e;
    } finally {
        put_live_recordings();
    }
}
