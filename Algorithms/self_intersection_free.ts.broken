import { Shape, Vector } from "@/Core";

export function walk_self_intersection_free(s: Shape.Shape): Shape.Shape {
    return walk_with_modified_self_intersections(s, "remove");
}

export function walk_with_self_intersections(s: Shape.Shape): Shape.Shape {
    return walk_with_modified_self_intersections(s, "add");
}

function walk_with_modified_self_intersections(
    s: Shape.Shape,
    modify_self_intersections: "remove" | "add",
): Shape.Shape {
    throw new Error();
}

type OutgoingPath = {
    next_index: number;
    fraction_to_next_index: number;
    out_direction: Vector;
    with_line_direction: boolean;
};

type Intersection = {
    vector: Vector;
    outgoing_paths: OutgoingPath[];
};

function intersection_positions_to_intersection_nodes(
    ip: [Shape.ShapePosition, Shape.ShapePosition][],
): Intersection[] {
    throw new Error();
}

type IntersectionWithDirection = [Intersection, Vector];

function find_outer_intersection(
    s: Shape,
    ip: Intersection[],
): IntersectionWithDirection {
    throw new Error();
}

type IntersectionWithPath = [Intersection, OutgoingPath];
type IntersectionPath = IntersectionWithPath[];

function find_outer_hull(
    from: IntersectionWithDirection,
    ip: Intersection[],
): IntersectionPath {
    throw new Error();
}

type IntersectionLoop =
    | {
          path: IntersectionPath;
          fixed_ends: null | Intersection | [Intersection, Intersection];
      }
    | {
          path: Intersection;
          fixed_end: Intersection;
      };

function deconstruct_outer_hull(
    hull: IntersectionPath,
): (IntersectionLoop | IntersectionPath)[] {
    throw new Error();
}

function path_loop(l: IntersectionLoop): IntersectionPath {
    throw new Error();
}

function find_subobjects(
    l: IntersectionLoop,
): [IntersectionLoop | IntersectionPath][] {
    throw new Error();
}

function merge_paths(p: IntersectionPath[]): IntersectionPath {
    throw new Error();
}

function intersection_path_to_vec_array(
    p: IntersectionPath,
    s: Shape.Shape,
): Vector[] {
    throw new Error();
}
