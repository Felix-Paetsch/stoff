import { newton } from "./newton";
import { binary } from "./binary";
import { proportional_binary } from "./proportional_binary";
import { monotone_boundary_computation } from "./boundary_computation";

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

export const Search = {
    newton: newton,
    binary: binary,
    proportional_binary: proportional_binary,
    monotone_boundary_computation: monotone_boundary_computation,
};
