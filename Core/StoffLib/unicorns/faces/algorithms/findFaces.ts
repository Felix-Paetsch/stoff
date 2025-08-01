import { Line } from "../../../line";
import Face from "../face";
import FaceAtlas from "../faceAtlas";

export default function findFaces(lines: Line[]): FaceAtlas {
    const prefaces: any[] = [];
    const to_visit: Line[] = lines.map(l => l);
    const rogue_lines: Line[] = [];

    while (to_visit.length > 0) {
        const boundary: Line[] = [];

        let current_line = to_visit.pop();
        boundary.push(current_line);
        let current_endpoint = current_line.p1;

        while (true) {
            // CurrentLine - CurrentEndpoint - NextLine
            current_endpoint = current_line.other_endpoint(current_endpoint);
            let possible_next_lines = to_visit.filter((l) => l.has_endpoint(current_endpoint))
            possible_next_lines.sort(
                (l1, l2) => l1.get_tangent_vector(current_endpoint).dot(current_line.get_tangent_vector(current_endpoint))
                    - l2.get_tangent_vector(current_endpoint).dot(current_line.get_tangent_vector(current_endpoint))
            );

            if (possible_next_lines.length == 0) {
                rogue_lines.push(current_line);

                if (boundary.length === 0) {
                    break;
                }

                const old_boundary_line = boundary.pop();

                current_endpoint = current_line.other_endpoint(current_endpoint);
                current_line = old_boundary_line;
                continue;
            }

            const other_endpoint = current_line.other_endpoint(current_endpoint);
            if (
                boundary[0].has_endpoint(other_endpoint) && !(boundary[1]?.has_endpoint(other_endpoint))
            ) {
                boundary.push(current_line);
                prefaces.push(boundary);
                break;
            }

            for (let i = 0; i < boundary.length - 1; i++) {
                if (boundary[i].has_endpoint(other_endpoint) && boundary[i + 1].has_endpoint(other_endpoint)) {
                    boundary.push(current_line);
                    const non_in_boundary = boundary.splice(i, 0, current_line);
                    to_visit.push(...non_in_boundary);
                    prefaces.push(boundary);
                    break;
                }
            }

            current_line = to_visit.pop();
            current_endpoint = current_line.p1;
        }

        return new FaceAtlas(prefaces.map(p => new Face(p, null as any)), FaceAtlas.rogue_lines_to_chains(rogue_lines));
    }


}