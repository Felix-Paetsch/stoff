import { EPS } from "../../eps";
import { ShapeVectors } from "../index";

export function remove_duplicate_points(
    line: ShapeVectors,
    distance: number = EPS.WEAK_EQUAL,
) {
    if (line.length <= 2) return line;

    let last_index = 0;
    return line.filter((point, index) => {
        if (index === 0) return true;
        const prevPoint = line[last_index]!;
        if (prevPoint.distance(point) > distance) {
            last_index = index;
            return true;
        }
        return false;
    });
}
