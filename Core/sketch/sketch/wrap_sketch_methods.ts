import { Sketch } from "../sketch";
import {
    EvaluationResult,
    MethodName,
    Toggle,
    wrap_class_prototype_methods,
    wrap_object_methods,
} from "@/Core/utils/prototype_modification";

export function wrap_sketch_methods(
    s: Sketch,
    method: (
        evaluate: () => EvaluationResult,
        s: Sketch,
        fn_name: string,
        args: any[],
    ) => EvaluationResult,
    wrap_on: null | MethodName<Sketch>[] = null,
): Toggle {
    return wrap_object_methods<Sketch>(
        s,
        method,
        wrap_on || sketch_graphical_non_pure_methods,
    );
}

export function wrap_sketch_prototype_methods(
    s: new (...args: any[]) => Sketch,
    method: (
        evaluate: () => EvaluationResult,
        s: Sketch,
        fn_name: string,
        args: any[],
    ) => EvaluationResult,
    wrap_on: null | MethodName<Sketch>[] = null,
): Toggle {
    return wrap_class_prototype_methods<Sketch>(
        s,
        method,
        wrap_on || sketch_graphical_non_pure_methods,
    );
}

export const sketch_graphical_non_pure_methods: MethodName<Sketch>[] = [
    "add_point",
    "clear",
    "copy_line",
    "intersect_lines",
    "interpolate_lines",
    "line_between_points",
    "line_from_function_graph",
    "line_at_angle",
    "line_with_offset",
    "merge_lines",
    "merge_points",
    "paste_sketch",
    "point_on_line",
    "remove",
];
