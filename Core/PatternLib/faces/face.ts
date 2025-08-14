import { polygon_contains_point } from "../../StoffLib/geometry.js";
import { Line } from "../../StoffLib/line.js";
import Point from "../../StoffLib/point.js";
import { ConnectedFaceComponent } from "./connectedFaceComponent.js";
import FaceAtlas from "./faceAtlas.js";
import RogueChain from "./rogue.js";
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
        const points: Vector[] = [];
        let last_point = this.boundary[0].other_endpoint(
            this.boundary[0].common_endpoint(this.boundary[1])
        );
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

            handedness.push(total % 2 == 0)
        }
        return handedness;
    }

    line_handedness(l: Line): boolean {
        // Whether the handedness of the line points to the face
        const hand = this.boundary_handedness()[this.boundary.indexOf(l)] || false;
        return hand === !this.is_boundary();
    }

    is_adjacent(other: Face | Line | Point | RogueChain): boolean {
        if (other instanceof RogueChain) {
            return this.is_adjacent(other.p1) || this.is_adjacent(other.p2);
        }
        if (other instanceof Point) {
            return this.boundary.some(l => l.has_endpoint(other));
        }
        if (other instanceof Line) {
            return this.boundary.some(l => l === other);
        }
        return this !== other && other.boundary.some(l => this.is_adjacent(l));
    }

    contains(thing: Point | Vector | Line | Face | RogueChain, only_interior: boolean = false): boolean {
        if (thing instanceof Face) {
            if (this == thing) return !only_interior;
            return thing.boundary.every(l => this.contains(l, only_interior));
        }
        if (thing instanceof Line) {
            if (this.boundary.includes(thing)) {
                return !only_interior;
            }

            return this.contains(thing.position_at_fraction(0.5), true);
        }
        if (thing instanceof RogueChain) {
            return this.contains(thing.lines[0].position_at_fraction(0.5), true);
        }
        if (
            thing instanceof Point && !only_interior
            && this.boundary.some(l => l.has_endpoint(thing))
        ) {
            return true;
        }
        return polygon_contains_point(this.point_hull(), thing);
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

    static from_boundary(boundary: Line[], faceAtlas: FaceAtlas): Face {
        const ordered = Line.order_by_endpoints(boundary);
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

        if (!polygon_orientation(polygon)) {
            lines.reverse();
            lines.orientations.reverse();
            lines.orientations = lines.orientations.map((o: boolean) => !o);
        }

        return lines;
    }
}

