import { put, put_live_recordings } from "./put";

export function run_wrapped<T>(fn: () => T): T {
    try {
        return fn();
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

export async function run_async_wrapped<T>(fn: () => Promise<T>): Promise<T> {
    try {
        const r = await fn();
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
