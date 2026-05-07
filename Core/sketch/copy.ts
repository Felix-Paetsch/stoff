import { CollectionMethods } from ".";
import { Line } from "./line";
import { Point } from "./point";
import { Sketch } from "./sketch";
import {
    SketchElement,
    SketchElementCollection,
    StoffObjectData,
} from "./types";

export type CopySketchObjectDataCallback = {
    (
        target_data: StoffObjectData,
        source_data: StoffObjectData,
        target: Line,
        source: Line,
    ): StoffObjectData;

    (
        target_data: StoffObjectData,
        source_data: StoffObjectData,
        target: Point,
        source: Point,
    ): StoffObjectData;

    (
        target_data: StoffObjectData,
        source_data: StoffObjectData,
        target: Sketch,
        source: Sketch,
    ): StoffObjectData;
};

export const default_data_callback: CopySketchObjectDataCallback =
    function default_data_callback(
        target: StoffObjectData,
        source: StoffObjectData,
    ) {
        return {
            ...target,
            ...source,
        };
    };

export const no_data_callback: CopySketchObjectDataCallback = () => {
    return {};
};

export type CorrespondingSketchElementMethod = {
    (p: Point): Point;
    (l: Line): Line;
    (s: SketchElement): SketchElement;
};

export type CopyResult = {
    points: Point[];
    lines: Line[];
    corresponding_sketch_element: CorrespondingSketchElementMethod;
};

export function sketch(
    source: Sketch,
    target: Sketch | null = null,
    data_callback: CopySketchObjectDataCallback | null = default_data_callback,
): CopyResult & {
    sketch: Sketch;
} {
    if (data_callback === null) {
        data_callback = default_data_callback;
    }

    if (!target) target = new Sketch();
    return {
        sketch: target,
        ...sketch_element_collection(source, target, data_callback),
    };
}

export function sketch_element_collection(
    source: SketchElementCollection,
    target_sketch: Sketch | null = null,
    data_callback: CopySketchObjectDataCallback | null = default_data_callback,
): CopyResult {
    if (!target_sketch) target_sketch = CollectionMethods.get_sketch(source);
    const ret_points: Point[] = [];
    const ret_lines: Line[] = [];

    const reference_array: ([Point, Point] | [Line, Line])[] = [];

    if (data_callback == null) {
        data_callback = default_data_callback;
    }

    CollectionMethods.get_points(source).forEach((pt) => {
        const new_pt = target_sketch.add_point(pt.vec);

        new_pt.data = data_callback({}, pt.data, new_pt, pt);
        reference_array.push([pt, new_pt]);
        ret_points.push(new_pt);
    });

    function get_corresponding_sketch_element(el: Point): Point;
    function get_corresponding_sketch_element(el: Line): Line;
    function get_corresponding_sketch_element(el: SketchElement): SketchElement;
    function get_corresponding_sketch_element(el: SketchElement) {
        for (let i = 0; i < reference_array.length; i++) {
            if (reference_array[i]![0] === el) {
                return reference_array[i]![1];
            }

            if (reference_array[i]![1] == el) {
                return reference_array[i]![0];
            }
        }

        throw new Error("Requested sketch element was not copied");
    }

    CollectionMethods.get_lines(source).forEach((line) => {
        const endpoint_1 = (reference_array.find((v) => v[0] == line.p1)?.[1] ??
            line.p1) as Point;
        const endpoint_2 = (reference_array.find((v) => v[0] == line.p2)?.[1] ??
            line.p2) as Point;

        const new_line = new Line([endpoint_1, endpoint_2], line.shape);
        new_line.right_handed = line.right_handed;
        new_line.data = data_callback({}, line.data, new_line, line);

        reference_array.push([line, new_line]);
        ret_lines.push(new_line);
    });

    return {
        points: ret_points,
        lines: ret_lines,
        corresponding_sketch_element: get_corresponding_sketch_element,
    };
}

export function point(
    pt: Point,
    to: Sketch | null = null,
    data_callback: null | CopySketchObjectDataCallback = null,
): Point {
    if (!to) to = pt.sketch;
    return sketch_element_collection(pt, to, data_callback).points[0]!;
}

export function line(
    ln: Line,
    from: Point,
    to: Point,
    data_callback?: CopySketchObjectDataCallback,
): Line;
export function line(
    ln: Line,
    to?: Sketch | null,
    data_callback?: CopySketchObjectDataCallback,
): Line;
export function line(ln: Line, ...res: any[]): Line {
    let new_ln: Line;
    if (res.length == 0 || res[0] == null || res[0] == ln.sketch) {
        new_ln = new Line(ln.endpoints(), ln.shape);
    } else if (res[0] instanceof Point) {
        new_ln = new Line([res[0]!, res[1]!], ln.shape);
    } else {
        new_ln = new Line(
            [point(ln.p1, res[0] as Sketch), point(ln.p2, res[0] as Sketch)],
            ln.shape,
        );
    }

    new_ln.right_handed = ln.right_handed;

    let data_callback: CopySketchObjectDataCallback = default_data_callback;
    if (typeof res[res.length - 1]! == "function") {
        data_callback = res[res.length - 1];
    }
    new_ln.data = data_callback({}, ln.data, new_ln, ln);

    return new_ln;
}
