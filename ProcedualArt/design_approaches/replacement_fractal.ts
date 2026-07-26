import { LinearTransform, Polyline, Vector } from "@/Core/geometry";

export function replacement_fractal(
    initial: Polyline,
    replacement: Polyline,
    iterations = 1,
): Polyline {
    if (iterations < 0) {
        throw new Error("iterations must be non-negative");
    }

    if (replacement.vertices.length < 2) {
        throw new Error(
            "replacement polyline must contain at least two vertices",
        );
    }

    let result = initial;

    for (let iteration = 0; iteration < iterations; iteration++) {
        result = replace_segments(result, replacement);
    }

    return result;
}

function replace_segments(line: Polyline, replacement: Polyline): Polyline {
    const vertices = line.vertices;

    if (vertices.length < 2) {
        return line;
    }

    const output: Vector[] = [vertices[0]!];

    for (let i = 1; i < vertices.length; i++) {
        const start = vertices[i - 1]!;
        const end = vertices[i]!;

        const map_replacement = LinearTransform.affine_orthogonal(
            [replacement.first()!, replacement.last()!],
            [start, end],
        );

        let transform = map_replacement;

        // Mirror every second replacement in target/world coordinates.
        if (i % 2 === 0) {
            transform = LinearTransform.compose(
                LinearTransform.mirror([start, end]),
                map_replacement,
            );
        }

        output.push(...replacement.map(transform).vertices.slice(1));
    }

    return new Polyline(output);
}
