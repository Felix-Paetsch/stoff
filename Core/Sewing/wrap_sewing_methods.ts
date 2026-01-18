import { EvaluationResult, MethodName, Toggle, wrap_class_prototype_methods, wrap_object_methods } from "@/Core/utils/prototype_modification";
import { Sewing } from "./sewing";

export function wrap_sewing_methods(
    s: Sewing,
    method: (evaluate: () => EvaluationResult, s: Sewing, fn_name: string, args: any[]) => EvaluationResult,
    wrap_on: null | (MethodName<Sewing>)[] = null
): Toggle {
    return wrap_object_methods<Sewing>(s, method, wrap_on || modifying_methods);
}

export function wrap_sewing_prototype_methods(
    s: new (...args: any[]) => Sewing,
    method: (evaluate: () => EvaluationResult, s: Sewing, fn_name: string, args: any[]) => EvaluationResult,
    wrap_on: null | (MethodName<Sewing>)[] = null
): Toggle {
    return wrap_class_prototype_methods<Sewing>(s, method, wrap_on || modifying_methods);
}

export const sewing_step_methods: MethodName<Sewing>[] = [
    "cut",
    "fold",
    "iron",
    "sew",
    "highlight"
];

export const modifying_methods: MethodName<Sewing>[] = [
    "cut",
    "fold",
    "iron",
    "sew",
    "highlight",
    "merge_lines",
    "merge_points",
    "sewing_point"
];
