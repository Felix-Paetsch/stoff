import { Interval } from "../../geometry";
import { gauss_legendre } from "../quadrature/gauss-legendre";

export function arc_length_intergrand(f: (x: number) => number) {
    return (x: number) => {
        const fx = f(x);
        return Math.sqrt(1 + fx * fx);
    };
}

export function arc_length(f: (x: number) => number, range: Interval.Interval) {
    return gauss_legendre(arc_length_intergrand(f), range);
}
