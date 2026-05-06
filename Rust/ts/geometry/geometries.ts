import { Polygon, Polyline, Vector } from "@/Core";

type WASMGeometry = Vector | Polygon | Polyline;

export function vecf64_to_geometry(arr: Float64Array): WASMGeometry {
    if (arr[0]! == 0) {
        return new Vector(arr[1]!, arr[2]!);
    }

    if (arr[0]! == 1) {
        return new Polyline(arr.slice(1));
    }

    return new Polygon(arr.slice(1));
}

export function geometry_to_vecf64(geom: WASMGeometry): Float64Array {
    if (geom instanceof Vector) {
        return new Float64Array([0, geom.x, geom.y]);
    }

    if (geom instanceof Polyline) {
        const vert_array = geom.positions;
        const result = new Float64Array(vert_array.length + 1);
        result[0] = 1;
        result.set(vert_array, 1);
        return result;
    }

    const vert_array = geom.positions;
    const result = new Float64Array(vert_array.length + 1);
    result[0] = 2;
    result.set(vert_array, 1);
    return result;
}

export function vecf64_to_geometry_vec(arr: Float64Array): WASMGeometry[] {
    if (arr.length === 0) return [];

    const res: WASMGeometry[] = [];
    let start = 0;

    for (let i = 1; i < arr.length; i++) {
        if (Number.isNaN(arr[i])) {
            res.push(vecf64_to_geometry(arr.slice(start, i)));
            start = i + 1;
        }
    }

    if (start < arr.length) {
        res.push(vecf64_to_geometry(arr.slice(start)));
    }

    return res;
}

export function geometry_vec_to_vecf64(geom: WASMGeometry[]): Float64Array {
    if (geom.length === 0) return new Float64Array(0);

    const chunks = geom.map(geometry_to_vecf64);
    const totalLength =
        chunks.reduce((sum, chunk) => sum + chunk.length, 0) +
        (geom.length - 1);

    const res = new Float64Array(totalLength);
    let offset = 0;

    chunks.forEach((chunk, index) => {
        if (index > 0) {
            res[offset++] = NaN;
        }

        res.set(chunk, offset);
        offset += chunk.length;
    });

    return res;
}
