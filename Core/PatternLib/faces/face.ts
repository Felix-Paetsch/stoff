import { BoundingBox, DOWN, LEFT, polygon_contains_point, RIGHT, UP } from "../../StoffLib/geometry.js";
import Line from "../../StoffLib/line.js";
import { Vector } from "@/Core/StoffLib/geometry.js";
import Point from "../../StoffLib/point.js";
import { ConnectedFaceComponent } from "./connectedFaceComponent.js";
import FaceAtlas from "./faceAtlas.js";
import RogueComponent from "./rogue.js";
import { polygon_orientation } from "@/Core/StoffLib/geometry.js";

export default class Face {
    constructor(
        readonly boundary: Line[],
        public orientation: boolean[],
        readonly faceAtlas?: FaceAtlas
    ) { }

    get_lines(): Line[] {
        return this.boundary;
    }

    get_points(): Point[] {
        return Array.from(new Set(this.boundary.flatMap(l => l.get_endpoints())));
    }

    component(): ConnectedFaceComponent {
        return this.faceAtlas ?
            this.faceAtlas.connectedComponents.find(c => c.faces.includes(this) || c.component == this)!
            : this.own_component();
    }

    is_boundary(): boolean {
        return !this.component().faces.includes(this);
    }

    point_hull(): Vector[] {
        try {
            const points: Vector[] = [];
            let last_point: Point;
            if (this.boundary.length > 2) {
                last_point = this.boundary[0].other_endpoint(
                    this.boundary[0].common_endpoint(this.boundary[1])!
                );
            } else {
                last_point = this.boundary[0].p1;
            }
            for (const line of this.boundary) {
                const sample_points = line.get_absolute_sample_points();
                if (line.p2 == last_point) {
                    sample_points.reverse();
                }
                points.push(...sample_points);
                last_point = line.other_endpoint(last_point);
            }
            return points;
        }
        catch (e) {
            return [this.boundary[0].p1, this.boundary[0].p1, this.boundary[0].p1];
        }
    }

    get_bounding_box(): BoundingBox {
        return BoundingBox.from_points(this.point_hull());
    }

    signed_area(): number {
        const points = this.point_hull();
        let area = 0;
        for (let i = 0; i < points.length; i++) {
            const p1 = points[i];
            const p2 = points[(i + 1) % points.length];
            area += p1.x * p2.y - p2.x * p1.y;
        }
        return area / 2;
    }

    area(): number {
        return Math.abs(this.signed_area());
    }

    is_clockwise_oriented(): boolean {
        return this.signed_area() > 0;
    }

    swap_orientation(): void {
        this.boundary.reverse();
        this.orientation.reverse();
        this.orientation = this.orientation.map(o => !o);
    }

    boundary_orientations(): boolean[] {
        return this.orientation;
    }

    boundary_handedness(): boolean[] {
        // True means inwards
        const clockwise = this.is_clockwise_oriented();
        const orientations = this.boundary_orientations();

        const handedness: boolean[] = [];
        for (let i = 0; i < this.boundary.length; i++) {
            const total = Number(
                this.boundary[i].right_handed,
            ) + Number(clockwise) + Number(
                orientations[i]
            );

            handedness.push(total % 2 == 1)
        }
        return handedness;
    }

    line_handedness(l: Line): boolean {
        // Whether the handedness of the line points to the face
        const hand = this.boundary_handedness()[this.boundary.indexOf(l)] || false;
        return hand === !this.is_boundary();
    }

    line_orientation(l: Line): boolean {
        // Whether the handedness of the line points to the face
        return this.boundary_orientations()[this.boundary.indexOf(l)] || false;
    }

    is_adjacent(other: Face | Line | Point | RogueComponent): boolean {
        if (other instanceof RogueComponent) {
            return other.get_points().some(p => this.is_adjacent(p));
        }
        if (other instanceof Point) {
            return this.boundary.some(l => l.has_endpoint(other));
        }
        if (other instanceof Line) {
            return this.boundary.some(l => l === other);
        }
        return this !== other && other.boundary.some(l => this.is_adjacent(l));
    }

    contains(thing: Point | Vector | Line | Face | RogueComponent, only_interior: boolean = false): boolean {
        if (thing instanceof Face) {
            if (this == thing) return !only_interior;
            return thing.boundary.every(l => this.contains(l, only_interior));
        }
        if (thing instanceof Line) {
            if (this.boundary.includes(thing)) {
                return !only_interior;
            }

            return this.contains(thing.position_at_fraction(0.5)!, true);
        }
        if (thing instanceof RogueComponent) {
            return this.contains(thing.lines[0].position_at_fraction(0.5)!, true);
        }
        if (
            thing instanceof Point && !only_interior
            && this.boundary.some(l => l.has_endpoint(thing))
        ) {
            return true;
        }

        const r = polygon_contains_point(this.point_hull(), thing);
        return r;
    }

    own_component(): ConnectedFaceComponent {
        return {
            parent_face: null,
            parent_component: null,
            faces: [this],
            component: this,
            outer_chains: [],
            inner_chains: [],
            subcomponents: []
        }
    }

    static from_boundary(boundary: Line[], faceAtlas?: FaceAtlas): Face {
        const ordered = Line.order_by_endpoints(...boundary);
        return new Face(ordered, ordered.orientations, faceAtlas);
    }

    static oriented_lines(lines: Line[]): Line[];
    static oriented_lines(...lines: Line[]): Line[];
    static oriented_lines(..._lines: Line[] | [Line[]]): Line[] {
        if (Array.isArray(_lines[0])) {
            _lines = _lines[0];
        }
        const lines: any = Line.order_by_endpoints(...(_lines as any));
        const polygon: Vector[] = [];
        for (let i = 0; i < lines.length; i++) {
            const abs = lines[i].get_absolute_sample_points();
            if (!lines.orientations[i]) {
                abs.reverse();
            }
            polygon.push(...abs);
        }

        return lines;
    }
}

