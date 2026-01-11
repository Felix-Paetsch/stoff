import { validate_sketch } from "../assert_methods/sketch_is_valid";

type SketchType = any;

const sketch_graphical_non_pure_methods = [
    "add_point",
    "clear",
    "copy_line",
    "copy_point",
    "intersect_lines",
    "interpolate_lines",
    "line_between_points",
    "line_from_function_graph",
    "line_with_length",
    "line_at_angle",
    "line_with_offset",
    "merge_lines",
    "merge_points",
    "paste_sketch",
    "point",
    "point_on_line",
    "remove"
] as const;

export function auto_validate(Sketch: SketchType) {
    Sketch.graphical_non_pure_methods = sketch_graphical_non_pure_methods;
    Sketch.graphical_non_pure_methods.forEach((methodName: string) => {
        const originalMethod = Sketch.prototype[methodName];
        let currently_internal = false;
        Sketch.prototype[methodName] = function (...args: any[]) {
            const was_already_internal = currently_internal;
            currently_internal = true;

            // console.log(args);
            const result = originalMethod.apply(this, args);
            if (!was_already_internal) validate_sketch(this);

            currently_internal = was_already_internal;
            return result;
        };
    });

}
