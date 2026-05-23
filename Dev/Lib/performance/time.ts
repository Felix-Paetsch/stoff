export function time<T>(fn: () => T, name: string = "Timer") {
    const start = performance.now();
    const result = fn();
    const durationMs = performance.now() - start;

    console.log(name + ":", durationMs);
    return result;
}
