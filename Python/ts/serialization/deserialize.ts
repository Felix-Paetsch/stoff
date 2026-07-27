import { Vector } from "Core/geometry/vector";
import { PyTransmittable, PyTransmittableTag } from "../py_transmittable";
import {
    deserialize_polygon,
    deserialize_polyline,
    deserialize_vector
} from "./geometry";
import {
    deserialize_length_graph,
    deserialize_shape_graph,
    deserialize_vertex_graph
} from "./graph";
import {
    deserialize_boolean_grid,
    deserialize_matrix_grid,
    deserialize_number_grid,
    deserialize_vec3_grid,
    deserialize_vector_grid
} from "./grid";
import { deserialize_gray_image, deserialize_rgb_image } from "./image";
import { destringify_f64_array, destringify_u8_array } from "./number_array";

export function deserialize_py_transmittable(r: {
    type: PyTransmittableTag;
    data: any;
}): PyTransmittable {
    const { type, data } = r;

    if (type == "float64_array") {
        return destringify_f64_array(data);
    }

    if (type == "uint8_array") {
        return destringify_u8_array(data);
    }

    if (type == "string") {
        return data;
    }

    if (type == "number") {
        return data;
    }

    if (type == "boolean") {
        return data;
    }

    if (type == "null") {
        return data;
    }

    if (type == "rgb_image") {
        return deserialize_rgb_image(
            r as {
                type: "rgb_image";
                data: any;
            }
        );
    }

    if (type == "gray_image") {
        return deserialize_gray_image(
            r as {
                type: "gray_image";
                data: any;
            }
        );
    }

    if (type == "polyline") {
        return deserialize_polyline(
            r as {
                type: "polyline";
                data: any;
            }
        );
    }

    if (type == "polygon") {
        return deserialize_polygon(
            r as {
                type: "polygon";
                data: any;
            }
        );
    }

    if (type == "vector") {
        return deserialize_vector(
            r as {
                type: "vector";
                data: any;
            }
        );
    }

    if (type == "number_grid") {
        return deserialize_number_grid(
            r as {
                type: "number_grid";
                data: any;
            }
        );
    }

    if (type == "vector_grid") {
        return deserialize_vector_grid(
            r as {
                type: "vector_grid";
                data: any;
            }
        );
    }

    if (type == "vec3_grid") {
        return deserialize_vec3_grid(
            r as {
                type: "vec3_grid";
                data: any;
            }
        );
    }

    if (type == "boolean_grid") {
        return deserialize_boolean_grid(
            r as {
                type: "boolean_grid";
                data: any;
            }
        );
    }

    if (type == "matrix_grid") {
        return deserialize_matrix_grid(
            r as {
                type: "matrix_grid";
                data: any;
            }
        );
    }

    if (type == "length_graph") {
        return deserialize_length_graph(
            r as {
                type: "length_graph";
                data: any;
            }
        );
    }

    if (type == "vertex_graph") {
        return deserialize_vertex_graph(
            r as {
                type: "vertex_graph";
                data: any;
            }
        );
    }

    if (type == "shape_graph") {
        return deserialize_shape_graph(
            r as {
                type: "shape_graph";
                data: any;
            }
        );
    }

    if (type == "number_array") {
        return Array.from(destringify_f64_array(data));
    }

    if (type == "vector_array") {
        const values = destringify_f64_array(data);
        const result: Vector[] = [];

        for (let i = 0; i < values.length; i += 2) {
            result.push(new Vector(values[i]!, values[i + 1]!));
        }

        return result;
    }

    if (type == "array") {
        return (data as any[]).map((a) => deserialize_py_transmittable(a));
    }

    if (type == "object") {
        return Object.fromEntries(
            Object.entries(data).map(([key, value]) => [
                key,
                deserialize_py_transmittable(value as any)
            ])
        );
    }

    throw new Error(`Unsupported transmittable type: ${type}`);
}
