export * as Approximations from "./approximations/index";
export * as Quadrature from "./quadrature/index";
export * as Search from "./search/index";

export { Bounds } from "./bounds";
export { EPS } from "./eps";
export * as Interval from "./interval";
export * as Spline from "./spline";

export * from "./histogram/index";
export * from "./partition_unity/index";

export type Fraction = number;

export function modulo(a: number, b: number) {
    return ((a % b) + b) % b;
}
