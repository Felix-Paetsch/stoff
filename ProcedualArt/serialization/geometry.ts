import { Polygon, Polyline, Vector } from "@/Core/geometry";
import { Json } from "@/Core/utils";
import { destringify_f64_array, stringify_f64_array } from "./number_array";

export function serialize_polyline(l: Polyline): {
    type: "polyline";
    data: Json;
} {
    return {
        type: "polyline",
        data: stringify_f64_array(l.positions)
    };
}

export function serialize_polygon(l: Polygon): {
    type: "polygon";
    data: Json;
} {
    return {
        type: "polygon",
        data: stringify_f64_array(l.positions)
    };
}

export function serialize_vector(v: Vector): {
    type: "vector";
    data: Json;
} {
    return {
        type: "vector",
        data: [v.x, v.y]
    };
}

export function deserialize_polyline(value: {
    type: "polyline";
    data: any;
}): Polyline {
    return new Polyline(destringify_f64_array(value.data));
}

export function deserialize_polygon(value: {
    type: "polygon";
    data: any;
}): Polygon {
    return new Polygon(destringify_f64_array(value.data));
}

export function deserialize_vector(value: {
    type: "vector";
    data: any;
}): Vector {
    const [x, y] = value.data as [number, number];
    return new Vector(x, y);
}
