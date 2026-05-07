import { Polygon, Polyline, Vector } from "@/Core";

type WASMGeometry = Vector | Polygon | Polyline;

export function vecf64_to_geometry(arr: Float64Array): WASMGeometry {
    if (arr.length === 0) {
        throw new Error("geometry slice is empty");
    }

    if (arr[0] === 0) {
        if (arr.length !== 3) {
            throw new Error("Point geometry must contain tag, x, y");
        }

        return new Vector(arr[1]!, arr[2]!);
    }

    if (arr[0] === 1) {
        if (arr.length < 3 || (arr.length - 1) % 2 !== 0) {
            throw new Error(
                "Polyline coordinate data must contain at least one x,y pair",
            );
        }

        return new Polyline(arr.slice(1));
    }

    if (arr[0] === 2) {
        if (arr.length < 3 || (arr.length - 1) % 2 !== 0) {
            throw new Error(
                "Polygon coordinate data must contain at least one x,y pair",
            );
        }

        return new Polygon(arr.slice(1));
    }

    throw new Error("geometry tag must be 0, 1, or 2");
}

export function geometry_to_vecf64(geom: WASMGeometry): Float64Array {
    if (geom instanceof Vector) {
        return new Float64Array([0, geom.x, geom.y]);
    }

    if (geom instanceof Polyline) {
        const vertArray = geom.positions;
        const result = new Float64Array(vertArray.length + 1);
        result[0] = 1;
        result.set(vertArray, 1);
        return result;
    }

    const vertArray = geom.positions;
    const result = new Float64Array(vertArray.length + 1);
    result[0] = 2;
    result.set(vertArray, 1);
    return result;
}

export function vecf64_to_geometry_vec(arr: Float64Array): WASMGeometry[] {
    if (arr.length === 0) return [];

    const res: WASMGeometry[] = [];
    let start = 0;

    for (let i = 0; i < arr.length; i++) {
        if (Number.isNaN(arr[i])) {
            if (i === start) {
                throw new Error("empty geometry slice between separators");
            }

            res.push(vecf64_to_geometry(arr.slice(start, i)));
            start = i + 1;
        }
    }

    if (start === arr.length) {
        throw new Error("trailing separator creates empty geometry slice");
    }

    res.push(vecf64_to_geometry(arr.slice(start)));

    return res;
}

export function geometry_vec_to_vecf64(geom: WASMGeometry[]): Float64Array {
    if (geom.length === 0) {
        return new Float64Array(0);
    }

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
