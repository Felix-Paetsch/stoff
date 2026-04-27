import { PlaneLine, Polygon, Polyline, Shape, Vector } from "@/Core";

export function offset_sharp(sh: Shape, offset: number): Shape;
export function offset_sharp(sh: Polyline, offset: number): Polyline;
export function offset_sharp(sh: Polygon, offset: number): Polygon;
export function offset_sharp(sh: Shape, offset: number): Shape {
    if (sh.vertex_count < 2) return sh;
    let last_line: PlaneLine | null = get_line_at_index(sh, -1, offset);
    if (!last_line) return sh;

    const res: Vector[] = [];
    for (let i = 0; i < sh.vertex_count; i++) {
        let new_line: PlaneLine = get_line_at_index(sh, i, offset)!;
        const int = last_line.intersect(new_line);
        if (int) {
            res.push(int);
        }
        last_line = new_line;
    }

    if (sh instanceof Polygon) {
        return new Polygon(res);
    }

    return new Polyline(res);
}

function get_line_at_index(
    sh: Shape,
    line_segment_index: number,
    offset: number,
): PlaneLine | null {
    if (sh instanceof Polyline && line_segment_index == -1) {
        const segment = Shape._get_appreciable_line_segment(sh, 0);
        if (!segment) return null;
        const dir_vec = segment[1].subtract(segment[0]).orthogonal();
        return PlaneLine.from_direction(segment[0], dir_vec);
    } else if (
        sh instanceof Polyline &&
        line_segment_index == sh.vertex_count - 1
    ) {
        const segment = Shape._get_appreciable_line_segment(
            sh,
            line_segment_index,
        );
        if (!segment) return null;
        const dir_vec = segment[1].subtract(segment[0]).orthogonal();
        return PlaneLine.from_direction(segment[1], dir_vec);
    }

    const segment = Shape._get_appreciable_line_segment(
        sh.typesafe(),
        line_segment_index % sh.vertex_count,
    )!;
    const dir_vec = segment[1].subtract(segment[0]).orthogonal().to_len(offset);

    return new PlaneLine(segment[0].add(dir_vec), segment[1].add(dir_vec));
}
