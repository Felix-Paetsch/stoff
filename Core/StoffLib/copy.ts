import { Vector } from "./geometry";
import { Point } from "./point";
import { Line } from "./line";
import { Sketch } from "./sketch";
import { SketchElement, SketchElementCollection, StoffObjectData } from "./types";
import { endpoint_hull, get_lines, get_points } from "./collection";

export type CopySketchObjectDataCallback = {
    (
        target_data: StoffObjectData,
        source_data: StoffObjectData,
        target: Line,
        source: Line
    ): StoffObjectData;

    (
        target_data: StoffObjectData,
        source_data: StoffObjectData,
        target: Point,
        source: Point
    ): StoffObjectData;

    (
        target_data: StoffObjectData,
        source_data: StoffObjectData,
        target: Sketch,
        source: Sketch
    ): StoffObjectData;
}

export type CorrespondingSketchElementMethod = {
    (p: Point): Point;
    (l: Line): Line;
    (s: SketchElement): SketchElement;
};

export type CopyResult = {
    points: Point[],
    lines: Line[],
    corresponding_sketch_element: CorrespondingSketchElementMethod
}

export const default_data_callback: CopySketchObjectDataCallback = function default_data_callback(target: StoffObjectData, source: StoffObjectData) {
    return {
        ...target,
        ...source
    }
}

export function copy_sketch(
    source: Sketch,
    target: Sketch,
    data_callback: CopySketchObjectDataCallback | null = default_data_callback,
    position: Vector | null = null
): CopyResult {
    if (data_callback === null) {
        data_callback = default_data_callback;
    }

    let offset;
    if (position instanceof Vector) {
        const src_top_left: Vector = (source as any).get_bounding_box().top_left;
        offset = position.subtract(src_top_left);
    } else {
        offset = new Vector(0, 0);
    }


    return copy_sketch_element_collection(
        source,
        target,
        offset
    );
}

export function copy_sketch_element_collection(
    source: SketchElementCollection,
    target_sketch: Sketch,
    offset: Vector | null = null
): CopyResult {
    const ret_points: Point[] = [];
    const ret_lines: Line[] = [];

    const reference_array: ([Point, Point] | [Line, Line])[] = [];
    const all_elements = endpoint_hull(source);

    get_points(all_elements).forEach((pt) => {
        const new_pt = target_sketch.add_point(
            pt.add(offset || new Vector(0, 0))
        );

        new_pt.set_attributes(pt.get_attributes());
        new_pt.data = { ...pt.data };
        reference_array.push([pt, new_pt]);
        ret_points.push(pt);
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

    get_lines(all_elements).forEach((line) => {
        const endpoint_1 = get_corresponding_sketch_element(line.p1);
        const endpoint_2 = get_corresponding_sketch_element(line.p2);
        const new_line = (target_sketch as any)._line_between_points_from_sample_points(
            endpoint_1,
            endpoint_2,
            line.copy_sample_points()
        );
        new_line.set_attributes(line.get_attributes());
        new_line.right_handed = line.right_handed;
        new_line.data = { ...line.data };

        reference_array.push([line, new_line]);
        ret_lines.push(line);
    });

    return {
        points: ret_points,
        lines: ret_lines,
        corresponding_sketch_element: get_corresponding_sketch_element
    };
}
