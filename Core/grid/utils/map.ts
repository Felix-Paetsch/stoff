import { Vector } from "@/Core/geometry";
import { BooleanGrid } from "../grids/boolean_grid";
import { Grid } from "../grids/grid";
import { NumberGrid } from "../grids/number_grid";
import { u8, Vec3, Vec3_u8 } from "../grids/types";
import { Uint8Grid } from "../grids/u8_grid";
import { Vec3Grid } from "../grids/vec3_grid";
import { Vec3UInt8Grid } from "../grids/vec3u8_grid";
import { VectorGrid } from "../grids/vector_grid";
import { group_grids } from "./group/index";

export function map_u8<T>(
    g: Grid<T>,
    fn: (v: T, vector: Vector) => u8,
): Uint8Grid {
    return Uint8Grid.from_iterable(g.dimensions(), g.map(fn));
}

export function map_f64<T>(
    g: Grid<T>,
    fn: (v: T, vector: Vector) => number,
): NumberGrid {
    return NumberGrid.from_iterable(g.dimensions(), g.map(fn));
}

export function map_vector<T>(
    g: Grid<T>,
    fn: (v: T, vector: Vector) => Vector,
): VectorGrid {
    return VectorGrid.from_iterable(g.dimensions(), g.map(fn));
}

export function map_boolean<T>(
    g: Grid<T>,
    fn: (v: T, vector: Vector) => boolean,
): BooleanGrid {
    return BooleanGrid.from_iterable(g.dimensions(), g.map(fn));
}

export function map_vec3<T>(
    g: Grid<T>,
    fn: (v: T, vector: Vector) => Vec3,
): Vec3Grid {
    return Vec3Grid.from_iterable(g.dimensions(), g.map(fn));
}

export function map_vec3_u8<T>(
    g: Grid<T>,
    fn: (v: T, vector: Vector) => Vec3_u8,
): Vec3UInt8Grid {
    return Vec3UInt8Grid.from_iterable(g.dimensions(), g.map(fn));
}

export function pair_map_u8<S, T>(
    g: Grid<S>,
    h: Grid<T>,
    fn: (v: S, w: T, vector: Vector) => u8,
): Uint8Grid {
    return Uint8Grid.from_iterable(
        g.dimensions(),
        group_grids(g, h).map((v, vec) => fn(v[0], v[1], vec)),
    );
}

export function pair_map_f64<S, T>(
    g: Grid<S>,
    h: Grid<T>,
    fn: (v: S, w: T, vector: Vector) => number,
): NumberGrid {
    return Uint8Grid.from_iterable(
        g.dimensions(),
        group_grids(g, h).map((v, vec) => fn(v[0], v[1], vec)),
    );
}

export function pair_map_vector<S, T>(
    g: Grid<S>,
    h: Grid<T>,
    fn: (v: S, w: T, vector: Vector) => Vector,
): VectorGrid {
    return VectorGrid.from_iterable(
        g.dimensions(),
        group_grids(g, h).map((v, vec) => fn(v[0], v[1], vec)),
    );
}

export function pair_map_vec3<S, T>(
    g: Grid<S>,
    h: Grid<T>,
    fn: (v: S, w: T, vector: Vector) => Vec3,
): Vec3Grid {
    return Vec3Grid.from_iterable(
        g.dimensions(),
        group_grids(g, h).map((v, vec) => fn(v[0], v[1], vec)),
    );
}

export function pair_map_vec3_u8<S, T>(
    g: Grid<S>,
    h: Grid<T>,
    fn: (v: S, w: T, vector: Vector) => Vec3_u8,
): Vec3UInt8Grid {
    return Vec3UInt8Grid.from_iterable(
        g.dimensions(),
        group_grids(g, h).map((v, vec) => fn(v[0], v[1], vec)),
    );
}

export function pair_map_boolean<S, T>(
    g: Grid<S>,
    h: Grid<T>,
    fn: (v: S, w: T, vector: Vector) => boolean,
): BooleanGrid {
    return BooleanGrid.from_iterable(
        g.dimensions(),
        group_grids(g, h).map((v, vec) => fn(v[0], v[1], vec)),
    );
}
