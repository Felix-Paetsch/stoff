import { Shape, Vector } from "@/Core";
import { Graph } from "Core/graph/graph";

export type TransmittableNodes = undefined | Vector;
export type TransmittableEdges = undefined | number | [Shape.Shape];

export type TransmittableGraph = AllGraphsHelper<
    TransmittableNodes,
    TransmittableEdges
>;
export type UnwrapSingletonTuple<T> = T extends [infer U] ? U : T;
export type AllGraphsHelper<A, B> = A extends any
    ? B extends any
        ? Graph<UnwrapSingletonTuple<A>, UnwrapSingletonTuple<B>>
        : never
    : never;

export type NodeMappingFunctionH<N, R> = R extends any
    ? (input: N, edge: Graph.Node<N>) => UnwrapSingletonTuple<R>
    : never;
export type EdgeMappingFunctionH<E, R> = R extends any
    ? (input: E, edge: Graph.Edge<E>) => UnwrapSingletonTuple<R>
    : never;

export type NodeMappingFunction<N> = NodeMappingFunctionH<
    N,
    TransmittableNodes
>;
export type EdgeMappingFunction<E> = EdgeMappingFunctionH<
    E,
    TransmittableEdges
>;
