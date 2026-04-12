export function stack_trace(cut_off: number = 0, len: number = Infinity) {
    const limit = len + cut_off;

    const tl: any = (Error as any).stackTraceLimit;
    (Error as any).stackTraceLimit = limit;

    const res: string = (new Error().stack as string)
        .split("\n")
        .slice(cut_off + 2)
        .map((s) => s.trim())
        .join("\n");

    (Error as any).stackTraceLimit = tl;
    return res;
}
