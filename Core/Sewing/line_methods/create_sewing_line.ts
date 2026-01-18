import { Line } from "@/Core/StoffLib/line";
import { Sewing } from "../sewing";
import { SewingLine } from "../sewingLine";
import { FaceEdge, FaceEdgeComponent } from "../faceEdge";
import { Face } from "@/Core/StoffLib/face";
import { assert } from "@/Core/assert";
import { FaceCarousel } from "../faceCarousel";

export function create_sewing_line(sewing: Sewing, line: Line): SewingLine {
    sewing.sewing_point(line.p1);
    sewing.sewing_point(line.p2);

    const sLine = new SewingLine(
        sewing,
        [{
            line: line,
            has_sewing_line_orientation: true,
            has_sewing_line_handedness: true
        }],
        [],
        null
    );

    const faces = sewing.adjacent_faces(line);
    const edges: FaceEdgeComponent[][] = [];

    if (!faces) throw new Error("Sketch of line doesnt belong to sewing.");
    if (faces[0] instanceof Face) {
        if (!faces[0].is_boundary()) {
            edges.push([{
                line: line,
                standard_handedness: true,
                standard_orientation: true
            }]);
        } else {
            const atlas = sewing.faceAtlases.get(line.get_sketch())!;
            const comp = atlas.component_from_face(faces[0]);
            const parent_face = comp.parent_face;
            if (parent_face) {
                edges.push([{
                    line: line,
                    standard_handedness: true,
                    standard_orientation: true
                }]);
            }
        }
        if (!(faces[1] as Face)?.is_boundary()) {
            edges.push([{
                line: line,
                standard_handedness: false,
                standard_orientation: true
            }]);
        } else if (faces[1]) {
            const atlas = sewing.faceAtlases.get(line.get_sketch())!;
            const comp = atlas.component_from_face(faces[1]);
            const parent_face = comp.parent_face;
            if (parent_face) {
                edges.push([{
                    line: line,
                    standard_handedness: false,
                    standard_orientation: true
                }]);
            }
        }
    } else {
        const face = faces[1];
        // Possible but strange case
        // A rogue chain that overlaps with two different components; or out in the wild
        assert(!face, "Sketch of line doesnt have a face.");
        assert(face?.is_boundary(), "Line is not contained inside fabric.");
        edges.push([{
            line: line,
            standard_handedness: true,
            standard_orientation: true
        }], [{
            line: line,
            standard_handedness: false,
            standard_orientation: true
        }]);

    }
    if (!line.right_handed) edges.reverse(); // First face always is to the right

    const faceEdges = edges.map(e => new FaceEdge(null, e));
    const carousel = new FaceCarousel(sLine, faceEdges.map(e => ({
        edge: e,
        sewOn: [line],
        folded_right: e.lines[0].standard_handedness === line.right_handed
    })));
    faceEdges.forEach(e => e._face_carousel = carousel);
    sLine._face_carousel = carousel;

    return sLine;
}
