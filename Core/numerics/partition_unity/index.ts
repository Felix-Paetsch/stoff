export type PartitionFunction = (x: number) => number[];

export * from "./partition_gauss";
export * from "./partition_linear";
export * from "./partition_shepard";

