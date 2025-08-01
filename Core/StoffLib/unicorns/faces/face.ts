import { polygon_contains_point } from "../../geometry.js";
import { Line } from "../../line.js";
import FaceAtlas from "./faceAtlas.js";
import RogueChain from "./rogue.js";

export default class Face {
    constructor(
        readonly boundary: Line[],
        readonly faceAtlas: FaceAtlas
    ) { }
    // The first line orientation is always the boundary orientation

    point_hull(): Vector[] {
        const points: Vector[] = [];
        let last_point = this.boundary[0].p1;
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

    is_clockwise_oriented(): boolean {
        return this.signed_area() > 0;
    }

    boundary_orientations(): boolean[] {
        const clockwise = this.is_clockwise_oriented();
        const orientations: boolean[] = [];
        let last_point = this.boundary[0].p1;

        for (const line of this.boundary) {
            orientations.push(line.p1 === last_point ? clockwise : !clockwise);
            last_point = line.other_endpoint(last_point);
        }
        return orientations;
    }

    boundary_handedness(): boolean[] {
        // True means inwards
        const clockwise = this.is_clockwise_oriented();
        const handedness: boolean[] = [];
        let last_point = this.boundary[0].p1;

        for (const line of this.boundary) {
            handedness.push(line.right_handed === clockwise);
            last_point = line.other_endpoint(last_point);
        }
        return handedness;
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
}