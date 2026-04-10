import { Interval } from "../../geometry";
import { Quadrature } from "../quadrature";

export function arc_length_intergrand(f: (x: number) => number) {
    return (x: number) => {
        const fx = f(x);
        return Math.sqrt(1 + fx * fx);
    };
}

export function arc_length(f: (x: number) => number, range: Interval.Interval) {
    return Quadrature.gauss_legendre(arc_length_intergrand(f), range);
}
