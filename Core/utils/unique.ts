function* intGenerator(): Generator<number, never, unknown> {
    let i = 0;
    while (true) {
        yield i++;
    }
}

const intGen = intGenerator();

export function unique_int(): number {
    const { value } = intGen.next();
    return value;
}

export function unique_int_gen(): () => number {
    const intGen = intGenerator();
    return () => {
        const { value } = intGen.next();
        return value;
    };
}

export function unique_string(): string {
    return `uid_${unique_int()}`;
}
