export function stringify_f64_array(values: number[] | Float64Array): string {
    const buffer = Buffer.alloc(values.length * Float64Array.BYTES_PER_ELEMENT);

    for (let i = 0; i < values.length; i++) {
        buffer.writeDoubleLE(values[i]!, i * Float64Array.BYTES_PER_ELEMENT);
    }

    return buffer.toString("base64");
}

export function stringify_u8_array(values: Uint8Array): string {
    return Buffer.from(values).toString("base64");
}

export function destringify_f64_array(base64: string): Float64Array {
    const buffer = Buffer.from(base64, "base64");

    if (buffer.length % Float64Array.BYTES_PER_ELEMENT !== 0) {
        throw new Error(
            "Invalid Float64Array data: byte length must be divisible by 8."
        );
    }

    const values = new Float64Array(
        buffer.length / Float64Array.BYTES_PER_ELEMENT
    );

    for (let i = 0; i < values.length; i++) {
        values[i] = buffer.readDoubleLE(i * Float64Array.BYTES_PER_ELEMENT);
    }

    return values;
}

export function destringify_u8_array(base64: string): Uint8Array {
    return Uint8Array.from(Buffer.from(base64, "base64"));
}
