import SketchElementCollection from "@/Core/StoffLib/sketch_element_collection";
import Line from "../../../StoffLib/line";
import Face from "../face";
import ConnectedComponent from "@/Core/StoffLib/connected_component";
import FaceAtlas from "../faceAtlas";
import RogueComponent from "../rogue";
import Point from "@/Core/StoffLib/point";
import { vec_angle_clockwise, ZERO } from "@/Core/StoffLib/geometry";

export type ConnectedComponentFaceData = {
    faces: Face[];
    outer_face: Face | null;
    rogue: RogueComponent[];
}


export default function findFaces(lines: Line[]) {
    const connected_components = (new SketchElementCollection(lines) as any).get_connected_components();
    const CC_faces = connected_components.map((cc: ConnectedComponent) => findConnectedComponentFaces(cc));
    return new FaceAtlas(CC_faces);
}

export function findConnectedComponentFaces(cc: ConnectedComponent): ConnectedComponentFaceData {
    const boundaries: {
        lines: Line[];
        orientation: boolean[];
    }[] = [];
    const rogue_lines: Line[] = [];

    const lines: Line[] = cc.get_lines();

    /*console.log("====================FF=============", lines.length);
    for (let i = 0; i < lines.length; i++) {
        lines[i].ident = i;
        lines[i].data["CIDENT"] = i;
    }*/

    const lines_map = new Map<Line, {
        with_orientation: boolean;
        against_orientation: boolean;
    }>();

    for (const line of lines) {
        lines_map.set(line, {
            with_orientation: false,
            against_orientation: false,
        })
    }

    for (const line of lines) {
        const visited = lines_map.get(line)!;
        outerLoop: for (const searching_with_orientation of [true, false]) {
            if (
                (searching_with_orientation && visited.with_orientation)
                || (!searching_with_orientation && visited.against_orientation)
            ) continue;

            const visited_lines: Line[] = [];
            const orientations = [];
            let latest_line = line;
            let latest_endpoint = line.endpoint_from_orientation(!searching_with_orientation); // The one after current line, before next line

            while (true) {
                if (visited_lines.length > lines.length) {
                    throw new Error("Visited to many");
                }

                for (let i = 0; i < visited_lines.length; i++) {
                    if (
                        visited_lines[i].endpoint_from_orientation(orientations[i]) == latest_endpoint
                    ) {
                        visited_lines.push(latest_line);
                        const latest_orientation = latest_line.p2 == latest_endpoint;
                        orientations.push(latest_orientation);
                        boundaries.push({
                            lines: visited_lines.splice(i),
                            orientation: orientations.splice(i),
                        });

                        const b = boundaries[boundaries.length - 1];
                        for (let i = 0; i < b.lines.length; i++) {
                            lines_map.get(b.lines[i])![b.orientation[i] ? "with_orientation" : "against_orientation"] = true;
                        }

                        // console.log(` Formed boundary | ${b.lines.map(l => l.data.CIDENT)}`)
                        // con	sole.log(` Orientations | ${b.orientation.toString()}`)
                        if (visited_lines.length == 0) {
                            continue outerLoop;
                        } else {
                            orientations.pop();
                            latest_line = visited_lines.pop()!;
                        }
                        break;
                    }
                }

                let lines_are_orderable = true;
                const possible_next_lines = lines.filter(
                    l => l.has_endpoint(latest_endpoint)
                        && lines_map.has(l)
                        && !visited_lines.includes(l)
                        && latest_line !== l
                        && !lines_map.get(l)![l.p1 == latest_endpoint ? "with_orientation" : "against_orientation"]
                ).sort((l1, l2) => {
                    const order = compare_lines_at_endpoint(l1, l2, latest_line, latest_endpoint);
                    if (order === 0) lines_are_orderable = false;
                    return order
                });

                // console.log(` LOOKINT AT LINE: ${ latest_line.data }  |  ${ possible_next_lines.map(l => l.data) }`);

                if (!lines_are_orderable) {
                    return {
                        faces: [],
                        outer_face: null,
                        rogue: FaceAtlas.rogue_lines_to_components(cc.get_lines()),
                    }
                }

                if (possible_next_lines.length == 0) {
                    rogue_lines.push(latest_line);
                    const obj = lines_map.get(latest_line)!;
                    obj.with_orientation = true;
                    obj.against_orientation = true;
                    if (visited_lines.length == 0) {
                        break;
                    }
                    orientations.pop();
                    latest_endpoint = latest_line.other_endpoint(latest_endpoint);
                    latest_line = visited_lines.pop()!;
                    continue;
                } else {
                    visited_lines.push(latest_line);
                    const latest_orientation = latest_line.p2 == latest_endpoint;
                    orientations.push(latest_orientation);
                    latest_line = possible_next_lines[0];
                    latest_endpoint = latest_line.other_endpoint(latest_endpoint);
                }
            }
        }
    }

    const res = [];
    let outer_face: {
        area: number;
        face: Face | null;
    } = {
        area: 0,
        face: null,
    };

    for (const boundary of boundaries) {
        const face = Face.from_boundary(boundary.lines);
        const area = face.area();
        if (area > outer_face.area) {
            outer_face.face && res.push(outer_face.face);
            outer_face.area = area;
            outer_face.face = face;
        } else {
            res.push(face);
        }
    }

    return {
        faces: res,
        outer_face: outer_face.face as Face,
        rogue: FaceAtlas.rogue_lines_to_components(rogue_lines),
    };
}

function compare_lines_at_endpoint(l1: Line, l2: Line, latest_line: Line, latest_endpoint: Point) {
    const rel_to = latest_line.get_tangent_vector(latest_endpoint).scale(-1);
    {
        const vec1 = l1.get_tangent_vector(latest_endpoint).scale(-1);
        const vec2 = l2.get_tangent_vector(latest_endpoint).scale(-1);
        const a1 = vec_angle_clockwise(rel_to, vec1, ZERO, true);
        const a2 = vec_angle_clockwise(rel_to, vec2, ZERO, true);
        const diff = a1 - a2;
        if (diff !== 0) {
            return diff;
        }
    }

    let vec1 = l1.get_tangent_vector(
        l1.position_at_fraction(0.05)
    ).scale(-1);
    if (latest_endpoint == l1.p2) {
        vec1 = vec1.scale(-1);
    }
    let vec2 = l2.get_tangent_vector(
        l2.position_at_fraction(0.05)
    ).scale(-1);
    if (latest_endpoint == l2.p2) {
        vec2 = vec2.scale(-1);
    }

    const diff = vec_angle_clockwise(rel_to, vec1, ZERO, true) - vec_angle_clockwise(rel_to, vec2, ZERO, true);
    return diff
}
