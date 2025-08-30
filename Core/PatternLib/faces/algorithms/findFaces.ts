import SketchElementCollection from "@/Core/StoffLib/sketch_element_collection";
import { Line } from "../../../StoffLib/line";
import Face from "../face";
import ConnectedComponent from "@/Core/StoffLib/connected_component";
import FaceAtlas from "../faceAtlas";
import RogueComponent from "../rogue";
import Point from "@/Core/StoffLib/point";

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
                        if (visited_lines[i] == latest_line) {
                            orientations.pop();
                            rogue_lines.push(visited_lines.pop()!);
                            const obj = lines_map.get(latest_line)!;
                            obj.with_orientation = true;
                            obj.against_orientation = true;
                        } else {
                            visited_lines.push(latest_line);
                            const latest_orientation = latest_line.p2 == latest_endpoint;
                            orientations.push(latest_orientation);
                            lines_map.get(latest_line)![latest_orientation ? "with_orientation" : "against_orientation"] = true;
                            boundaries.push({
                                lines: visited_lines.splice(i),
                                orientation: orientations.splice(i),
                            });
                        }

                        if (visited_lines.length == 0) {
                            continue outerLoop;
                        }
                        break;
                    }
                }

                let lines_are_orderable = true;
                const possible_next_lines = lines.filter(
                    l => l.has_endpoint(latest_endpoint)
                        && lines_map.has(l)
                        && l !== latest_line
                        && !lines_map.get(l)![l.p1 == latest_endpoint ? "with_orientation" : "against_orientation"]
                ).sort((l1, l2) => {
                    const order = compare_lines_at_endpoint(l1, l2, latest_line, latest_endpoint);
                    if (order === 0) lines_are_orderable = false;
                    return searching_with_orientation ? order : -order;
                });

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
                    lines_map.get(latest_line)![latest_orientation ? "with_orientation" : "against_orientation"] = true;
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
        const face = new Face(boundary.lines, boundary.orientation);
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
    {
        const dot1 = l1.get_tangent_vector(latest_endpoint).dot(latest_line.get_tangent_vector(latest_endpoint));
        const dot2 = l2.get_tangent_vector(latest_endpoint).dot(latest_line.get_tangent_vector(latest_endpoint));
        const diff = dot2 - dot1;
        if (diff !== 0) {
            return diff;
        }
    }

    let p1 = l1.get_tangent_vector(
        l1.position_at_fraction(0.05)
    );
    if (latest_endpoint == l1.p2) {
        p1 = p1.scale(-1);
    }
    const dot1 = p1.dot(latest_line.get_tangent_vector(latest_endpoint));

    let p2 = l2.get_tangent_vector(
        l2.position_at_fraction(0.05)
    );
    if (latest_endpoint == l2.p2) {
        p2 = p2.scale(-1);
    }
    const dot2 = p2.dot(latest_line.get_tangent_vector(latest_endpoint));

    const diff = dot2 - dot1;
    // if (diff === 0) console.log("Two lines are on top of each other");
    return diff;
}