export function get_trace(cut_off: number = 0) {
    const tl: any = (Error as any).stackTraceLimit;
    (Error as any).stackTraceLimit = Infinity;

    const res: string = (new Error().stack as string).split("\n").slice(cut_off + 2).map((s) => s.trim()).join("\n");

    (Error as any).stackTraceLimit = tl;
    return res;
}
