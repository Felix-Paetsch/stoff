import { Vector, mirror_type } from "./geometry";
import { copy_sketch_element_collection } from "./copy";
import { BoundingBox } from "./geometry/bounding_box";
import { SketchElement } from "./types";
import { MirrorData } from "./geometry/types";
import { Point } from "./point";
import { Line } from "./line";
import { Sketch } from "./sketch";
import { same_sketch } from "./assert_methods/exports";
import { assert } from ".././assert";

export class ConnectedComponent {
    constructor(
        private root_el: SketchElement
    ) { }

    root() {
        return this.root_el;
    }

    mirror(md: MirrorData = null) {
        const { points, lines } = this.obj();

        points.forEach((pt) => pt.move_to(pt.mirror_at(md)));
        if (mirror_type(md) == "Line") {
            lines.forEach((l) => l.mirror());
        }
    }

    group_by_key(key: string) {
        const { points, lines } = this.obj();
        const groupedPoints: Record<string, Point[]> = points.reduce((acc: Record<string, Point[]>, pt: Point) => {
            const groupKey = pt.data[key] !== undefined ? pt.data[key] : "_";
            if (!acc[groupKey]) {
                acc[groupKey] = [];
            }
            acc[groupKey].push(pt);
            return acc;
        }, {});

        const groupedLines: Record<string, Line[]> = lines.reduce((acc: Record<string, Line[]>, line: Line) => {
            const groupKey =
                line.data[key] !== undefined ? line.data[key] : "_";
            if (!acc[groupKey]) {
                acc[groupKey] = [];
            }
            acc[groupKey].push(line);
            return acc;
        }, {});

        return {
            points: groupedPoints,
            lines: groupedLines,
        };
    }

    lines_by_key(key: string) {
        return this.group_by_key(key).lines;
    }

    points_by_key(key: string) {
        return this.group_by_key(key).points;
    }

    get_points() {
        return this.obj().points;
    }

    get_lines() {
        return this.obj().lines;
    }

    get_sketch_elements(): SketchElement[] {
        const r = this.obj();
        return (r.points as SketchElement[]).concat(r.lines);
    }

    get_sketch() {
        return this.root_el.get_sketch();
    }

    get_bounding_box() {
        return this.obj().bounding_box;
    }

    contains(el: SketchElement): boolean {
        const { points, lines } = this.obj();
        if (el instanceof Point) {
            return points.includes(el);
        }
        return lines.includes(el);
    }

    equals(component: ConnectedComponent): boolean {
        return this.contains(component.root());
    }

    obj(): {
        points: Point[],
        lines: Line[],
        bounding_box: BoundingBox
    } {
        let currently_visiting_point;
        if (this.root_el instanceof Point) {
            currently_visiting_point = this.root_el;
        } else {
            currently_visiting_point = this.root_el.p1;
        }

        const visited_points: Point[] = [];
        const visited_lines: Line[] = [];
        const to_visit_points: Point[] = [currently_visiting_point];

        while (to_visit_points.length > 0) {
            currently_visiting_point = to_visit_points.pop()!;
            if (visited_points.includes(currently_visiting_point)) {
                continue;
            }
            for (const line of currently_visiting_point.get_adjacent_lines()) {
                if (!visited_lines.includes(line)) {
                    visited_lines.push(line);
                    to_visit_points.push(...(line as Line).get_endpoints());
                }
            }
            visited_points.push(currently_visiting_point);
        }

        return {
            points: visited_points,
            lines: visited_lines,
            bounding_box: BoundingBox.from_points((visited_points as Vector[]).concat(
                visited_lines.flatMap((l: Line) => l.get_absolute_sample_points()),
            ))
        }
    }

    toString() {
        return "[ConnectedComponent]" as const;
    }

    paste_to_sketch(target: Sketch, position: Vector | null = null) {
        const res = copy_sketch_element_collection(this, target, position);
        return new ConnectedComponent(
            res.corresponding_sketch_element(this.root())
        );
    }
}

export class AvoidantConnectedComponent extends ConnectedComponent {
    constructor(
        root_el: SketchElement,
        private avoids: SketchElement[]
    ) {
        super(root_el);

        assert(same_sketch(root_el, ...avoids));
        assert(!avoids.includes(root_el));
    }

    override obj(): {
        points: Point[],
        lines: Line[],
        bounding_box: BoundingBox
    } {
        let currently_visiting_point;
        const root = this.root();
        if (root instanceof Point) {
            currently_visiting_point = root;
        } else {
            currently_visiting_point = root.p1;
        }

        const forbidden_points = this.avoids.filter(p => p instanceof Point);
        const forbidden_lines = this.avoids.filter(p => p instanceof Line);

        const visited_points: Point[] = [];
        const visited_lines: Line[] = [];
        const to_visit_points: Point[] = [currently_visiting_point];

        while (to_visit_points.length > 0) {
            currently_visiting_point = to_visit_points.pop()!;
            if (
                visited_points.includes(currently_visiting_point)
                || forbidden_points.includes(currently_visiting_point)
            ) {
                continue;
            }
            for (const line of currently_visiting_point.get_adjacent_lines()) {
                if (
                    !visited_lines.includes(line)
                    && !forbidden_lines.includes(line)
                ) {
                    visited_lines.push(line);
                    to_visit_points.push(...(line as Line).get_endpoints());
                }
            }
            visited_points.push(currently_visiting_point);
        }

        return {
            points: visited_points,
            lines: visited_lines,
            bounding_box: BoundingBox.from_points((visited_points as Vector[]).concat(
                visited_lines.flatMap((l: Line) => l.get_absolute_sample_points()),
            ))
        }
    }
}
