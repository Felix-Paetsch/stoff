import { EPS, PlaneLine, Polygon, Polyline, Shape, Vector } from "@/Core";

type Segment = [Vector, Vector];

const DEFAULT_MITER_LIMIT = 4;

export function offset_sharp(
    sh: Shape,
    offset: number,
    miter_limit?: number,
): Shape;
export function offset_sharp(
    sh: Polyline,
    offset: number,
    miter_limit?: number,
): Polyline;
export function offset_sharp(
    sh: Polygon,
    offset: number,
    miter_limit?: number,
): Polygon;
export function offset_sharp(
    sh: Shape,
    offset: number,
    miter_limit: number = DEFAULT_MITER_LIMIT,
): Shape {
    if (sh.vertex_count < 2 || offset === 0) return sh;

    if (sh instanceof Polygon) {
        return offset_polygon(sh, offset, miter_limit);
    }

    return offset_polyline(sh as Polyline, offset, miter_limit);
}

function offset_polygon(
    sh: Polygon,
    offset: number,
    miter_limit: number,
): Polygon {
    const res: Vector[] = [];

    for (let i = 0; i < sh.vertex_count; i++) {
        const join_points = get_polygon_join_points(sh, i, offset, miter_limit);
        push_points_unique(res, join_points);
    }

    if (
        res.length > 1 &&
        res[0]!.distance_squared(res[res.length - 1]!) <= EPS.tiny ** 2
    ) {
        res.pop();
    }

    return new Polygon(res);
}

function offset_polyline(
    sh: Polyline,
    offset: number,
    miter_limit: number,
): Polyline {
    const first_segment = get_first_appreciable_segment(sh);
    const last_segment = get_last_appreciable_segment(sh);

    if (!first_segment || !last_segment) {
        return sh;
    }

    const res: Vector[] = [];

    const start_cap = make_square_cap_line(first_segment, offset, true);
    const first_offset_line = make_offset_line(first_segment, offset);
    const start_point = start_cap.intersect(first_offset_line);
    if (start_point) {
        push_point_unique(res, start_point);
    }

    for (let i = 1; i < sh.vertex_count - 1; i++) {
        const join_points = get_polyline_join_points(
            sh,
            i,
            offset,
            miter_limit,
        );
        push_points_unique(res, join_points);
    }

    const end_cap = make_square_cap_line(last_segment, offset, false);
    const last_offset_line = make_offset_line(last_segment, offset);
    const end_point = last_offset_line.intersect(end_cap);
    if (end_point) {
        push_point_unique(res, end_point);
    }

    return new Polyline(res);
}

function get_polygon_join_points(
    sh: Polygon,
    corner_index: number,
    offset: number,
    miter_limit: number,
): Vector[] {
    const prev_segment = get_prev_polygon_segment(sh, corner_index);
    const next_segment = get_next_polygon_segment(sh, corner_index);

    if (!prev_segment || !next_segment) {
        return [];
    }

    const corner = sh.as_polyline().vertices[corner_index]!;
    return make_join_points(
        corner,
        prev_segment,
        next_segment,
        offset,
        miter_limit,
    );
}

function get_polyline_join_points(
    sh: Polyline,
    corner_index: number,
    offset: number,
    miter_limit: number,
): Vector[] {
    const prev_segment = get_prev_polyline_segment(sh, corner_index);
    const next_segment = get_next_polyline_segment(sh, corner_index);

    if (!prev_segment || !next_segment) {
        return [];
    }

    const corner = sh.as_polyline().vertices[corner_index]!;
    return make_join_points(
        corner,
        prev_segment,
        next_segment,
        offset,
        miter_limit,
    );
}

function make_join_points(
    corner: Vector,
    prev_segment: Segment,
    next_segment: Segment,
    offset: number,
    miter_limit: number,
): Vector[] {
    const prev_offset_segment = make_offset_segment(prev_segment, offset);
    const next_offset_segment = make_offset_segment(next_segment, offset);

    const prev_line = new PlaneLine(
        prev_offset_segment[0],
        prev_offset_segment[1],
    );
    const next_line = new PlaneLine(
        next_offset_segment[0],
        next_offset_segment[1],
    );

    const intersection = prev_line.intersect(next_line);

    if (
        intersection &&
        is_miter_within_limit(corner, intersection, offset, miter_limit)
    ) {
        return [intersection];
    }

    return make_bevel_points(prev_offset_segment[1], next_offset_segment[0]);
}

function is_miter_within_limit(
    corner: Vector,
    intersection: Vector,
    offset: number,
    miter_limit: number,
): boolean {
    if (miter_limit <= 0) {
        return false;
    }

    const max_distance = Math.abs(offset) * miter_limit;
    return corner.distance_squared(intersection) <= max_distance * max_distance;
}

function make_bevel_points(a: Vector, b: Vector): Vector[] {
    if (a.distance_squared(b) <= EPS.tiny ** 2) {
        return [a];
    }

    return [a, b];
}

function make_offset_segment(segment: Segment, offset: number): Segment {
    const [a, b] = segment;
    const normal = b.subtract(a).orthogonal().to_len(offset);
    return [a.add(normal), b.add(normal)];
}

function make_offset_line(segment: Segment, offset: number): PlaneLine {
    const [a, b] = make_offset_segment(segment, offset);
    return new PlaneLine(a, b);
}

function make_square_cap_line(
    segment: Segment,
    offset: number,
    at_start: boolean,
): PlaneLine {
    const [a, b] = segment;

    const tangent = b.subtract(a).to_len(Math.abs(offset));
    const cap_direction = b.subtract(a).orthogonal();

    const anchor = at_start ? a.subtract(tangent) : b.add(tangent);

    return PlaneLine.from_direction(anchor, cap_direction);
}

function get_first_appreciable_segment(sh: Polyline): Segment | null {
    for (let i = 0; i < sh.vertex_count - 1; i++) {
        const segment = Shape._get_appreciable_line_segment(sh, i);
        if (segment) return segment;
    }

    return null;
}

function get_last_appreciable_segment(sh: Polyline): Segment | null {
    for (let i = sh.vertex_count - 2; i >= 0; i--) {
        const segment = Shape._get_appreciable_line_segment(sh, i);
        if (segment) return segment;
    }

    return null;
}

function get_prev_polyline_segment(
    sh: Polyline,
    corner_index: number,
): Segment | null {
    for (let i = corner_index - 1; i >= 0; i--) {
        const segment = Shape._get_appreciable_line_segment(sh, i);
        if (segment) return segment;
    }

    return null;
}

function get_next_polyline_segment(
    sh: Polyline,
    corner_index: number,
): Segment | null {
    for (let i = corner_index; i < sh.vertex_count - 1; i++) {
        const segment = Shape._get_appreciable_line_segment(sh, i);
        if (segment) return segment;
    }

    return null;
}

function get_prev_polygon_segment(
    sh: Polygon,
    corner_index: number,
): Segment | null {
    for (let step = 0; step < sh.vertex_count; step++) {
        const i = mod(corner_index - 1 - step, sh.vertex_count);
        const segment = Shape._get_appreciable_line_segment(sh, i);
        if (segment) return segment;
    }

    return null;
}

function get_next_polygon_segment(
    sh: Polygon,
    corner_index: number,
): Segment | null {
    for (let step = 0; step < sh.vertex_count; step++) {
        const i = mod(corner_index + step, sh.vertex_count);
        const segment = Shape._get_appreciable_line_segment(sh, i);
        if (segment) return segment;
    }

    return null;
}

function push_points_unique(res: Vector[], points: Vector[]): void {
    for (const point of points) {
        push_point_unique(res, point);
    }
}

function push_point_unique(res: Vector[], point: Vector): void {
    if (
        res.length === 0 ||
        res[res.length - 1]!.distance_squared(point) > EPS.tiny ** 2
    ) {
        res.push(point);
    }
}

function mod(n: number, m: number): number {
    return ((n % m) + m) % m;
}
