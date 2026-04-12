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

// Note that this is not secure for cryptography
export function uuid(): string {
    return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
        const r = (Math.random() * 16) | 0;
        const v = c === "x" ? r : (r & 0x3) | 0x8;
        return v.toString(16);
    });
}
