import { Matrix, Vector } from "@/Core/geometry";
import { Json } from "@/Core/utils";
import {
    BooleanGrid,
    MatrixGrid,
    NumberGrid,
    Vec3Grid,
    VectorGrid,
    grid_from_array
} from "@/ProcArt/grid";
import {
    destringify_f64_array,
    destringify_u8_array,
    stringify_f64_array,
    stringify_u8_array
} from "./number_array";

export function serialize_number_grid(v: NumberGrid): {
    type: "number_grid";
    data: Json;
} {
    return {
        type: "number_grid",
        data: {
            dimensions: v.dimensions(),
            values: stringify_f64_array(v.values_ref())
        }
    };
}

export function serialize_vector_grid(v: VectorGrid): {
    type: "vector_grid";
    data: Json;
} {
    return {
        type: "vector_grid",
        data: {
            dimensions: v.dimensions(),
            values: stringify_f64_array(
                v.values_ref().flatMap((v) => [v.x, v.y])
            )
        }
    };
}

export function serialize_vec3_grid(v: Vec3Grid): {
    type: "vec3_grid";
    data: Json;
} {
    return {
        type: "vec3_grid",
        data: {
            dimensions: v.dimensions(),
            values: stringify_f64_array(v.values_ref().flat())
        }
    };
}

export function serialize_boolean_grid(v: BooleanGrid): {
    type: "boolean_grid";
    data: Json;
} {
    return {
        type: "boolean_grid",
        data: {
            dimensions: v.dimensions(),
            // False: 0, True: 1
            values: stringify_u8_array(Uint8Array.from(v.values_ref()))
        }
    };
}

export function serialize_matrix_grid(v: MatrixGrid): {
    type: "matrix_grid";
    data: Json;
} {
    return {
        type: "matrix_grid",
        data: {
            dimensions: v.dimensions(),
            values: stringify_f64_array(
                v.values_ref().flatMap((v) => [v.a, v.b, v.c, v.d])
            )
        }
    };
}

export function deserialize_number_grid(value: {
    type: "number_grid";
    data: any;
}): NumberGrid {
    return grid_from_array(
        "number",
        value.data.dimensions,
        destringify_f64_array(value.data.values)
    );
}

export function deserialize_vector_grid(value: {
    type: "vector_grid";
    data: any;
}): VectorGrid {
    const values = destringify_f64_array(value.data.values);
    const vectors: Vector[] = [];

    for (let i = 0; i < values.length; i += 2) {
        vectors.push(new Vector(values[i]!, values[i + 1]!));
    }

    return grid_from_array("vector", value.data.dimensions, vectors);
}

export function deserialize_vec3_grid(value: {
    type: "vec3_grid";
    data: any;
}): Vec3Grid {
    const values = destringify_f64_array(value.data.values);
    const vectors: [number, number, number][] = [];

    for (let i = 0; i < values.length; i += 3) {
        vectors.push([values[i]!, values[i + 1]!, values[i + 2]!]);
    }

    return grid_from_array("vec3", value.data.dimensions, vectors);
}

export function deserialize_boolean_grid(value: {
    type: "boolean_grid";
    data: any;
}): BooleanGrid {
    const values = destringify_u8_array(value.data.values);

    return grid_from_array(
        "boolean",
        value.data.dimensions,
        Array.from(values, (value) => value !== 0)
    );
}

export function deserialize_matrix_grid(value: {
    type: "matrix_grid";
    data: any;
}): MatrixGrid {
    const values = destringify_f64_array(value.data.values);
    const matrices: Matrix[] = [];

    for (let i = 0; i < values.length; i += 4) {
        matrices.push(
            Matrix.from_entries(
                values[i]!,
                values[i + 1]!,
                values[i + 2]!,
                values[i + 3]!
            )
        );
    }

    return grid_from_array("matrix", value.data.dimensions, matrices);
}
