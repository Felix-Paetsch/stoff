import { validate_sketch } from "../assert_methods/sketch_is_valid";
import { Sketch } from "../sketch";
import { wrap_sketch_prototype_methods } from "./wrap_sketch_methods";

export function auto_validate(SC: new (...args: any[]) => Sketch) {
    let currently_internal = false;

    wrap_sketch_prototype_methods(
        SC,
        (evaluate, s) => {
            const was_already_internal = currently_internal;
            currently_internal = true;

            const res = evaluate();

            if (!was_already_internal) validate_sketch(s);

            currently_internal = was_already_internal;
            return res;
        }
    );
}
