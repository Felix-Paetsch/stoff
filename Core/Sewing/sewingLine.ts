import { Line } from "../StoffLib/line.js";
import { Sewing } from "./sewing.ts";
import { SewingPoint } from "./sewingPoint.ts";
import Point from "../StoffLib/point.js";
import SketchElementCollection from "../StoffLib/sketch_element_collection.js";
import { EPS } from "../StoffLib/geometry.js";

export type SewingLineComponent = {
    line: Line,
    has_sewing_line_orientation: boolean,
    has_sewing_line_handedness: boolean,
}

export type PartialSewingLineComponent = {
    line: Line,
    position: number | [number, number] // from the Line orientation;
    // -1 < x < 0 or 0 < x <= 1; 0 <= x < y <= 1
} & SewingLineComponent;

export class SewingLine {
    public outdated: boolean;

    constructor(
        readonly sewing: Sewing,
        readonly primary_component: SewingLineComponent[],
        readonly other_components: PartialSewingLineComponent[] = [],
    ) {
        this.outdated = false;
    }

    get p1(): SewingPoint {
        const first = this.primary_component[0];
        return this.sewing.sewing_point(
            first.line.endpoint_from_orientation(
                first.has_sewing_line_orientation
            )
        )
    }

    get p2(): SewingPoint {
        const last = this.primary_component[this.primary_component.length - 1];
        return this.sewing.sewing_point(
            last.line.endpoint_from_orientation(
                !last.has_sewing_line_orientation
            )
        )
    }

    get_endpoints(): [SewingPoint, SewingPoint] {
        return [this.p1, this.p2];
    }

    other_endpoint(pt: Point | SewingPoint): SewingPoint {
        const endpoints = this.get_endpoints();
        if (endpoints[0].is(pt)) {
            return endpoints[1];
        }
        return endpoints[0];
    }

    endpoint_from_orientation(bool = true): SewingPoint {
        return bool ? this.get_endpoints()[0] : this.get_endpoints()[1];
    }

    has_endpoint(pt: Point | SewingPoint): boolean {
        const endpoints = this.get_endpoints();
        return endpoints[0].is(pt) || endpoints[1].is(pt);
    }

    common_endpoint(line: SewingLine | Line): SewingPoint | null {
        if (this.p1.is(line.p1) || this.p1.is(line.p2)) {
            return this.p1;
        }
        return this.p2.is(line.p1) || this.p2.is(line.p2) ? this.p2 : null;
    }

    is_adjacent(thing: SewingLine | Line | Point | SewingPoint): boolean {
        if (thing instanceof Point || thing instanceof SewingPoint) {
            return this.p1.is(thing) || this.p2.is(thing);
        }

        return this.common_endpoint(thing) !== null && !this.contains(thing);
    }

    get_adjacent_lines(): SewingLine[] {
        const lines = this.get_endpoints().flatMap((p) => p.get_sewing_lines());
        return lines.filter((l) => l !== this).filter(
            (line, index, array) => array.indexOf(line) === index
        );
    }

    get_lines(include_partial_components: boolean = false): Line[] {
        if (include_partial_components) {
            return this.primary_component
                .concat(this.other_components)
                .map((l) => l.line);
        }
        return this.primary_component.map((l) => l.line);
    }

    get_points(include_partial_components: boolean = false): Point[] {
        const points = new SketchElementCollection(
            this.primary_component.flatMap((l) => {
                if (l.has_sewing_line_orientation) {
                    return [l.line.p1, l.line.p2];
                } else {
                    return [l.line.p2, l.line.p1];
                }
            })
        )

        if (!include_partial_components) {
            return (points as any).unique();
        }

        for (const component of this.other_components) {
            if (typeof component.position === "number") {
                if (component.position > 0) {
                    points.push(
                        component.line.endpoint_from_orientation(
                            component.has_sewing_line_orientation
                        )
                    );
                    if (1 - component.position < EPS.COARSE) {
                        points.push(
                            component.line.endpoint_from_orientation(
                                !component.has_sewing_line_orientation
                            )
                        );
                    }
                } else {
                    points.push(
                        component.line.endpoint_from_orientation(
                            !component.has_sewing_line_orientation
                        )
                    );
                    if (component.position + 1 < EPS.COARSE) {
                        points.push(
                            component.line.endpoint_from_orientation(
                                component.has_sewing_line_orientation
                            )
                        );
                    }
                }
            } else {
                const [x, y] = component.position;
                if (x < EPS.COARSE) {
                    points.push(
                        component.line.endpoint_from_orientation(
                            component.has_sewing_line_orientation
                        )
                    );
                }

                if (y > 1 - EPS.COARSE) {
                    points.push(
                        component.line.endpoint_from_orientation(
                            !component.has_sewing_line_orientation
                        )
                    );
                }
            }
        }
        return (points as any).unique();
    }

    get right_handed(): boolean {
        return this.primary_component[0].has_sewing_line_handedness
            == this.primary_component[0].line.right_handed;
    }

    swap_orientation() {
        this.primary_component.forEach((l) => l.has_sewing_line_orientation = !l.has_sewing_line_orientation);
        this.other_components.forEach((l) => l.has_sewing_line_orientation = !l.has_sewing_line_orientation);
        this.primary_component.reverse();
        return this;
    }

    swap_handedness(): boolean {
        this.primary_component.forEach((l) => l.has_sewing_line_handedness = !l.has_sewing_line_handedness);
        this.other_components.forEach((l) => l.has_sewing_line_handedness = !l.has_sewing_line_handedness);
        return this.right_handed;
    }

    same_orientation(line: SewingLine | Line): boolean {
        if (line instanceof Line) {
            for (const component of this.primary_component.concat(this.other_components)) {
                if (component.line === line) {
                    return component.has_sewing_line_orientation;
                }
            }

            if (line.common_endpoint(this.primary_component[0].line)) {
                return this.primary_component[0].has_sewing_line_orientation
                    == this.primary_component[0].line.same_orientation(line);
            }

            if (line.common_endpoint(this.primary_component[this.primary_component.length - 1].line)) {
                return this.primary_component[this.primary_component.length - 1].has_sewing_line_orientation
                    == this.primary_component[this.primary_component.length - 1].line.same_orientation(line);
            }

            return false;
        }

        const own_endpoints = this.get_endpoints();
        const other_endpoints = line.get_endpoints();
        return own_endpoints[0].is(other_endpoints[1]) || own_endpoints[1].is(other_endpoints[0]);
    }

    same_handedness(line: SewingLine | Line): boolean {
        if (line instanceof Line) {
            for (const component of this.primary_component.concat(this.other_components)) {
                if (component.line === line) {
                    return component.has_sewing_line_handedness;
                }
            }

            if (line.common_endpoint(this.primary_component[0].line)) {
                return this.primary_component[0].has_sewing_line_handedness
                    == this.primary_component[0].line.same_handedness(line);
            }

            if (line.common_endpoint(this.primary_component[this.primary_component.length - 1].line)) {
                return this.primary_component[this.primary_component.length - 1].has_sewing_line_handedness
                    == this.primary_component[this.primary_component.length - 1].line.same_handedness(line);
            }

            return false;
        }

        const firstThis = this.primary_component[0];
        const firstThat = line.primary_component[0];
        const lastThis = this.primary_component[this.primary_component.length - 1];
        const lastThat = line.primary_component[line.primary_component.length - 1];

        for (const lThis of [firstThis, lastThis]) {
            for (const lThat of [firstThat, lastThat]) {
                if (lThis.line.is_adjacent(lThat.line)) {
                    const same_handednessL = lThis.line.same_handedness(lThat.line);
                    const same_handednessSL = lThis.has_sewing_line_handedness
                        == lThat.has_sewing_line_handedness;
                    return same_handednessL == same_handednessSL;
                }
            }
        }

        return false;
    }

    set_orientation(p1: SewingPoint, p2?: SewingPoint) {
        const endpoints = this.get_endpoints();
        if (endpoints[0].is(p1)) {
            return this;
        }
        return this.swap_orientation();
    }

    set_handedness(line: SewingLine | Line | boolean): boolean {
        const current_handedness = this.right_handed;
        if (typeof line === "boolean") {
            if (line === current_handedness) {
                return current_handedness;
            }
            return this.swap_handedness();
        }
        if (this.same_handedness(line)) {
            return current_handedness;
        }
        return this.swap_handedness();
    }

    updated(): SewingLine {
        return this.sewing.sewing_lines.find((l) => l.contains(
            this.primary_component[0].line
        ));
    }

    contains(things: Line | Point | SewingLine | SewingPoint): boolean;
    contains(things: (Line | Point | SewingLine | SewingPoint)[]): boolean;
    contains(things: Line | Point | SewingLine | SewingPoint | (Line | Point | SewingLine | SewingPoint)[]): boolean {
        const own_lines = this.get_lines();
        const own_points = this.get_points();

        if (!Array.isArray(things)) {
            things = [things];
        }
        for (const thing of things) {
            if (thing instanceof SewingLine) {
                if (!thing.get_lines().every((l) => own_lines.some((l2) => l === l2))) {
                    return false;
                }
            } else if (thing instanceof Line) {
                if (!own_lines.some((l) => l === thing)) {
                    return false;
                }
            } else if (thing instanceof SewingPoint) {
                const endpoints = this.get_endpoints();
                if (!(endpoints[0].is(thing) || endpoints[1].is(thing))) {
                    return false;
                }
            } else if (!own_points.includes(thing)) {
                return false;
            }
        }

        return true;
    }

    get_length() {
        return this.get_lines().reduce((acc, l) => acc + l.get_length(), 0);
    }

    is_circular(): boolean {
        return this.p1 == this.p2;
    }

    is_straight(): boolean {
        throw new Error("Not implemented");
    }

    is_convex(): boolean {
        throw new Error("Not implemented");
    }
}