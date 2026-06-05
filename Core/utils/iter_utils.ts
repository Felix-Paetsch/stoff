export function enumerate<T>(
    iterable: Iterable<T>,
): IterableIterator<[number, T]> {
    const iterator = iterable[Symbol.iterator]();
    let index = 0;

    const result: IterableIterator<[number, T]> = {
        next(): IteratorResult<[number, T]> {
            const item = iterator.next();

            if (item.done) {
                return { value: undefined, done: true };
            }

            return { value: [index++, item.value], done: false };
        },

        [Symbol.iterator]() {
            return this;
        },
    };

    return result;
}

export function map<T, S>(
    iterable: Iterable<T>,
    fn: (v: T, i: number) => S,
): IterableIterator<S> {
    const iterator = iterable[Symbol.iterator]();
    let index = 0;

    const result: IterableIterator<S> = {
        next(): IteratorResult<S> {
            const item = iterator.next();

            if (item.done) {
                return { value: undefined, done: true };
            }

            return { value: fn(item.value, index++), done: false };
        },

        [Symbol.iterator]() {
            return this;
        },
    };

    return result;
}

export function every<T>(
    iterable: Iterable<T>,
    fn: (value: T) => boolean,
): boolean {
    for (const value of iterable) {
        if (!fn(value)) return false;
    }
    return true;
}

export function iter<T>(iterable: Iterable<T>, fn: (value: T) => {}) {
    for (const value of iterable) {
        fn(value);
    }
}
