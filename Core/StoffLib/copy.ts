import { Vector } from "./geometry.js";
import Point from "./point.js";
import Line from "./line.js";
import Sketch from "./sketch.js";
import ConnectedComponent from "./connected_component.js";
import { SketchElement, SketchElementCollectionLike, SketchElementData } from "./types.js";

export type CopySketchDataCallback = {
    (
        target_data: SketchElementData,
        source_data: SketchElementData,
        target: Line,
        source: Line
    ): SketchElementData | undefined;

    (
        target_data: SketchElementData,
        source_data: SketchElementData,
        target: Point,
        source: Point
    ): SketchElementData | undefined;

    (
        target_data: SketchElementData,
        source_data: SketchElementData,
        target: Sketch,
        source: Sketch
    ): SketchElementData | undefined;
}

export const default_data_callback: CopySketchDataCallback = function default_data_callback(...data) {
    const objs: any[] = data.filter((d) => {
        return !(
            d instanceof Line ||
            d instanceof Point ||
            d instanceof ConnectedComponent ||
            d instanceof Sketch
        );
    });
    return Object.assign({}, ...objs);
}

export const copy_data_callback: CopySketchDataCallback = function copy_data_callback(...data) {
    const objs: any[] = data.filter((d) => {
        return !(
            d instanceof Line ||
            d instanceof Point ||
            d instanceof ConnectedComponent ||
            d instanceof Sketch
        );
    });
    return Object.assign({}, ...objs.map((d) => dublicate_data(d)));
}

function copy_sketch_obj_data(
    source: SketchElement,
    target: SketchElement,
    data_callback = copy_data_callback,
    include_appearance: boolean = true
) {
    if (include_appearance) {
        if (
            (source instanceof Line && target instanceof Line) ||
            (source instanceof Point && target instanceof Point)
        ) {
            const sa = source.get_attributes();
            for (const key in sa) {
                (target as any).set_attribute(key, (sa as any)[key]);
            }
        }
    }
    const data_copy = dublicate_data(source.data);
    target.data =
        data_callback(target.data, source.data, target as any, source as any) || data_copy;
    return target.data;
}

function copy_sketch(
    source: Sketch,
    target: Sketch,
    data_callback = copy_data_callback,
    position: Vector | null = null
) {
    if (data_callback === null) {
        data_callback = copy_data_callback;
    }

    let offset;
    if (position instanceof Vector) {
        const src_top_left: Vector = (source as any).get_bounding_box().top_left;
        offset = position.subtract(src_top_left);
    } else {
        offset = new Vector(0, 0);
    }

    const { corresponding_sketch_element } = copy_points_lines(
        source.get_points(),
        source.get_lines(),
        target,
        offset
    );

    const data_copy = dublicate_data(
        source.data,
        corresponding_sketch_element as any
    );

    target.data =
        data_callback(target.data, data_copy, target, source) || target.data;
    return target.data;
}

function copy_sketch_element_collection(
    source: SketchElementCollectionLike,
    target: Sketch,
    position: Vector | null = null
) {
    const {
        points,
        lines
    }: {
        points: Point[],
        lines: Line[]
    } = (source as any).endpoint_hull().obj();

    let offset;
    if (position instanceof Vector) {
        const src_top_left: Vector = (source as any).get_bounding_box().top_left;
        offset = position.subtract(src_top_left);
    } else {
        offset = new Vector(0, 0);
    }

    const { new_sketch_elements, corresponding_sketch_element } =
        copy_points_lines(points, lines, target, offset);

    const res = (target as any).make_sketch_element_collection(new_sketch_elements);
    res.get_corresponding_sketch_element = corresponding_sketch_element;
    return res;
}

function copy_points_lines(
    points: Point[],
    lines: Line[],
    target_sketch: Sketch,
    offset = new Vector(0, 0)
) {
    // Offset will be added to all points
    const reference_array: ([Point, Point] | [Line, Line])[] = [];

    points.forEach((pt) => {
        const new_pt = target_sketch.add_point(
            pt.add(offset) // Vector
        );

        new_pt.set_attributes(pt.get_attributes());
        reference_array.push([pt, new_pt]);
    });

    function get_corresponding_sketch_element(el: Point): Point;
    function get_corresponding_sketch_element(el: Line): Line;
    function get_corresponding_sketch_element(el: SketchElement) {
        for (let i = 0; i < reference_array.length; i++) {
            if (reference_array[i][0] === el) {
                return reference_array[i][1];
            }
        }

        if ((target_sketch as any).get_sketch_elements().includes(el)) {
            return el;
        }

        throw new Error("Requested sketch element not in the sketch");
    }

    lines.forEach((line) => {
        const endpoint_1 = get_corresponding_sketch_element(line.p1);
        const endpoint_2 = get_corresponding_sketch_element(line.p2);
        const new_line = (target_sketch as any)._line_between_points_from_sample_points(
            endpoint_1,
            endpoint_2,
            line.copy_sample_points()
        );
        new_line.set_attributes(line.get_attributes());
        new_line.right_handed = line.right_handed;

        reference_array.push([line, new_line]);
    });

    for (const [original, copy] of reference_array) {
        const data_copy = dublicate_data(
            original.data,
            get_corresponding_sketch_element as (st: SketchElement) => SketchElement
        );

        Object.assign(copy.data, data_copy);
    }

    return {
        corresponding_sketch_element: get_corresponding_sketch_element,
        new_sketch_elements: reference_array.map((el) => el[1]),
    };
}

export {
    copy_sketch_obj_data,
    copy_sketch_element_collection,
    copy_sketch,
    dublicate_data,
};


function dublicate_data(data: any, get_sketch_element_reference: (st: SketchElement) => SketchElement = (st: SketchElement) => st) {
    try {
        return JSON.parse(JSON.stringify(data));
    } catch {
        return custom_dublicate_data(data, get_sketch_element_reference);
    }
}

function custom_dublicate_data(data: any, get_sketch_element_reference: (st: SketchElement) => SketchElement = (st: SketchElement) => st) {
    let nesting = 0;
    return nesting_buffer(data);
    function nesting_buffer(data: any): any {
        nesting++;
        if (nesting > 50) {
            throw new Error(
                "Can't create deep copy of data for source sketch! (Nesting > " +
                50 +
                ")"
            );
        }

        // Basic Stuff
        if (
            [
                "undefined",
                "boolean",
                "number",
                "bigint",
                "string",
                "symbol",
            ].includes(typeof data)
        ) {
            nesting--;
            return data;
        }

        // Arrays
        if (data instanceof Array) {
            nesting--;
            return data.map(nesting_buffer);
        }

        if (!data) {
            return data;
        }

        // Basic dicts
        if (data.constructor === Object) {
            const new_data: any = {};
            for (const key in data) {
                new_data[key] = nesting_buffer(data[key]);
            }
            nesting--;
            return new_data;
        }

        // Points
        if (data instanceof Point || data instanceof Line) {
            nesting--;
            return get_sketch_element_reference(data);
        }

        // Vectors
        if (data instanceof Vector) {
            nesting--;
            return data;
        }

        if (data instanceof ConnectedComponent) {
            const root = data.root_el;
            return new ConnectedComponent(get_sketch_element_reference(root));
        }

        throw new Error(
            "Can't create deep copy of data for source sketch! (Invalid data type)"
        );
    }
}
