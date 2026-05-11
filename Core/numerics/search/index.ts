export { binary } from "./binary";
export { monotone_boundary_computation } from "./boundary_computation";
export { newton } from "./newton";
export { proportional_binary } from "./proportional_binary";

export type TerminationCriteria = {
    iterations?: number;
    x_change?: number;
    y_change?: number;
    distance?: number;
};

export type SearchResult = {
    x: number;
    fx: number;
    terminationReason:
        | "iterations"
        | "x_change"
        | "y_change"
        | "distance"
        | "hard_stop"
        | "method_error";
};
