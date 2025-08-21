import SketchElementCollection from "@/Core/StoffLib/sketch_element_collection";
import { Line } from "../../../StoffLib/line";
import Face from "../face";
import ConnectedComponent from "@/Core/StoffLib/connected_component";
import FaceAtlas from "../faceAtlas";
import RogueChain from "../rogue";

export type ConnectedComponentFaceData = {
    faces: Face[];
    outer_face: Face | null;
    chains: RogueChain[];
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

    outerLoop: for (const line of lines) {
        const visited = lines_map.get(line)!;
        if (visited.with_orientation && visited.against_orientation) continue;

        const visited_lines: Line[] = [];
        const orientations = [];
        let latest_line = line;
        let latest_endpoint = line.endpoint_from_orientation(visited.with_orientation); // The one after current line, before next line
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

            const possible_next_lines = lines.filter(
                l => l.has_endpoint(latest_endpoint)
                    && lines_map.has(l)
                    && l !== latest_line
                    && !lines_map.get(l)![l.p1 == latest_endpoint ? "with_orientation" : "against_orientation"]
            ).sort((l1, l2) => l1.get_tangent_vector(latest_endpoint).dot(latest_line.get_tangent_vector(latest_endpoint))
                - l2.get_tangent_vector(latest_endpoint).dot(latest_line.get_tangent_vector(latest_endpoint))
            );

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
        chains: FaceAtlas.rogue_lines_to_chains(rogue_lines),
    };
}