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
