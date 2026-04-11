export function run_wrapped<T>(fn: () => T, title = "main"): T {
    try {
        return fn();
    } catch (e: any) {
        throw e;
    }
}
