import { Line } from "../StoffLib/line";
import { SewingPoint } from "./sewingPoint";
import { Point } from "../StoffLib/point";
import { FaceCarousel } from "./faceCarousel";
import { FaceEdge } from "./faceEdge";
import { merge_intervals } from "../StoffLib/geometry";
import { assert } from "../assert.ts";

export type SewingLineComponent = {
    line: Line,
    has_sewing_line_orientation: boolean,
    has_sewing_line_handedness: boolean
}

export type PartialSewingLineComponent = SewingLineComponent & {
    sewTo: Line[]
}

export class SewingLine {
    public _is_outdated: boolean = false;
    public _update_to: SewingLine | null = null;

    constructor(
        public endpoints: [SewingPoint, SewingPoint],
        readonly primary_component: SewingLineComponent[],
        readonly other_components: PartialSewingLineComponent[],
        public _face_carousel: FaceCarousel | null
    ) {
        this.endpoints[0].__register_line(this);
        this.endpoints[1].__register_line(this);
        this.get_sewing().__register_line(this);
    }

    get face_carousel(): FaceCarousel {
        assert(!!this._face_carousel, "Face carousel not initialized yet");
        return this._face_carousel!
    }

    get_sewing() {
        return this.p1.get_sewing();
    }

    get p1(): SewingPoint {
        assert(!this._is_outdated);
        return this.endpoints[0];
    }

    get p2(): SewingPoint {
        assert(!this._is_outdated);
        return this.endpoints[1];
    }

    get_endpoints(): [SewingPoint, SewingPoint] {
        assert(!this._is_outdated);
        return [this.p1, this.p2];
    }

    other_endpoint(pt: Point | SewingPoint): SewingPoint {
        assert(!this._is_outdated);
        const endpoints = this.get_endpoints();
        if (endpoints[0].is(pt)) {
            return endpoints[1];
        }
        return endpoints[0];
    }

    endpoint_from_orientation(bool = true): SewingPoint {
        assert(!this._is_outdated);
        return bool ? this.get_endpoints()[0] : this.get_endpoints()[1];
    }

    has_endpoint(pt: Point | SewingPoint): boolean {
        assert(!this._is_outdated);
        const endpoints = this.get_endpoints();
        return endpoints[0].is(pt) || endpoints[1].is(pt);
    }

    common_endpoint(line: SewingLine | Line): SewingPoint {
        assert(!this._is_outdated);
        if (this.p1.is(line.p1) || this.p1.is(line.p2)) {
            return this.p1;
        }
        if (this.p2.is(line.p1) || this.p2.is(line.p2)) {
            return this.p2;
        }

        throw new Error("No points in common");
    }

    is_adjacent(thing: SewingLine | Line | Point | SewingPoint): boolean {
        assert(!this._is_outdated);
        if (thing instanceof Point || thing instanceof SewingPoint) {
            return this.p1.is(thing) || this.p2.is(thing);
        }

        return this.common_endpoint(thing) !== null && !this.contains(thing);
    }

    get_adjacent_lines(): SewingLine[] {
        assert(!this._is_outdated);
        const lines = this.get_endpoints().flatMap((p) => p.adjacent_lines);
        return lines.filter((l) => l !== this).filter(
            (line, index, array) => array.indexOf(line) === index
        );
    }

    get_lines(): Line[] {
        assert(!this._is_outdated);
        return this.primary_component
            .concat(this.other_components)
            .map((l) => l.line);
    }

    get_points(): Point[] {
        assert(!this._is_outdated);
        return Array.from(new Set(this.get_lines().flatMap(l => l.get_endpoints())));
    }

    face_edges(): FaceEdge[] {
        assert(!this._is_outdated);
        return this.face_carousel.faceEdges.map((e) => e.edge);
    }

    get right_handed(): boolean {
        assert(!this._is_outdated);
        return this.primary_component[0]!.has_sewing_line_handedness
            == this.primary_component[0]!.line.right_handed;
    }

    swap_orientation() {
        assert(!this._is_outdated);
        this.primary_component.forEach((l) => l.has_sewing_line_orientation = !l.has_sewing_line_orientation);
        this.other_components.forEach((l) => l.has_sewing_line_orientation = !l.has_sewing_line_orientation);
        this.primary_component.reverse();
        this.face_carousel._swap_orientation();
        return this;
    }

    swap_handedness(): boolean {
        assert(!this._is_outdated);
        this.primary_component.forEach((l) => l.has_sewing_line_handedness = !l.has_sewing_line_handedness);
        this.other_components.forEach((l) => l.has_sewing_line_handedness = !l.has_sewing_line_handedness);
        return this.right_handed;
    }

    same_orientation(line: SewingLine | Line): boolean {
        assert(!this._is_outdated);
        if (line instanceof Line) {
            for (const component of this.primary_component.concat(this.other_components)) {
                if (component.line === line) {
                    return component.has_sewing_line_orientation;
                }
            }

            if (line.common_endpoint(this.primary_component[0]!.line)) {
                return this.primary_component[0]!.has_sewing_line_orientation
                    == this.primary_component[0]!.line.same_orientation(line);
            }

            if (line.common_endpoint(this.primary_component[this.primary_component.length - 1]!.line)) {
                return this.primary_component[this.primary_component.length - 1]!.has_sewing_line_orientation
                    == this.primary_component[this.primary_component.length - 1]!.line.same_orientation(line);
            }

            return false;
        }

        const own_endpoints = this.get_endpoints();
        const other_endpoints = line.get_endpoints();
        return own_endpoints[0].is(other_endpoints[1]) || own_endpoints[1].is(other_endpoints[0]);
    }

    same_handedness(line: SewingLine | Line): boolean {
        assert(!this._is_outdated);
        if (line instanceof Line) {
            for (const component of this.primary_component.concat(this.other_components)) {
                if (component.line === line) {
                    return component.has_sewing_line_handedness;
                }
            }

            if (line.common_endpoint(this.primary_component[0]!.line)) {
                return this.primary_component[0]!.has_sewing_line_handedness
                    == this.primary_component[0]!.line.same_handedness(line);
            }

            if (line.common_endpoint(this.primary_component[this.primary_component.length - 1]!.line)) {
                return this.primary_component[this.primary_component.length - 1]!.has_sewing_line_handedness
                    == this.primary_component[this.primary_component.length - 1]!.line.same_handedness(line);
            }

            return false;
        }

        const firstThis = this.primary_component[0]!;
        const firstThat = line.primary_component[0]!;
        const lastThis = this.primary_component[this.primary_component.length - 1]!;
        const lastThat = line.primary_component[line.primary_component.length - 1]!;

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

    set_orientation(thing: SewingLine | Line | SewingPoint | Point) {
        assert(!this._is_outdated);
        if (thing instanceof Line || thing instanceof SewingLine) {
            if (this.same_orientation(thing)) {
                return;
            }
            return this.swap_orientation();
        }

        const endpoints = this.get_endpoints();
        if (endpoints[0].is(thing)) {
            return;
        }
        return this.swap_orientation();
    }

    set_handedness(line: SewingLine | Line | boolean): boolean {
        assert(!this._is_outdated);
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
        if (!this._is_outdated) return this;
        if (!this._update_to) {
            throw new Error("Sewing line can't be updated");
        }
        return this._update_to.updated()
    }

    contains(things: Line | Point | SewingLine | SewingPoint): boolean;
    contains(things: (Line | Point | SewingLine | SewingPoint)[]): boolean;
    contains(things: Line | Point | SewingLine | SewingPoint | (Line | Point | SewingLine | SewingPoint)[]): boolean {
        assert(!this._is_outdated);
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
        assert(!this._is_outdated);
        return this.primary_component.reduce((acc, l) => acc + l.line.get_length(), 0);
    }

    is_circular(): boolean {
        assert(!this._is_outdated);
        return this.p1 == this.p2;
    }

    is_straight(): boolean {
        assert(!this._is_outdated);
        throw new Error("Not implemented");
    }

    is_convex(): boolean {
        assert(!this._is_outdated);
        throw new Error("Not implemented");
    }

    __mark_outdated(update_to?: SewingLine | null) {
        assert(!this._is_outdated);
        this.get_sewing().__unregister_line(this);
        this._is_outdated = true;
        if (typeof update_to !== "undefined") {
            this._update_to = update_to;
        }
    }

    position(lin: Line): [number, number] {
        assert(!this._is_outdated);
        let start_position = 0;

        const component = this.other_components.find(c => c.line === lin);
        if (component) {
            return merge_intervals(
                ...component.sewTo.map(l => this.position(l))
            )
        }

        for (const l of this.primary_component.map(c => c.line)) {
            if (l !== lin) {
                start_position += l.get_length();
                continue;
            }

            const lin_length = lin.get_length();
            const this_length = this.get_length();
            const start_pos = start_position / this_length;

            return [
                start_pos,
                start_pos + lin_length / this_length
            ];
        }

        throw new Error("Line not found in SewingLine");
    }

    structured_sublines(lin: Line[]) {
        assert(!this._is_outdated);
        return lin.map(l => ({
            line: l,
            position: this.position(l),
            orientation: this.same_orientation(l),
            handedness: this.same_handedness(l)
        })).sort((a, b) => a.position[0] - b.position[0]);
    }
}
