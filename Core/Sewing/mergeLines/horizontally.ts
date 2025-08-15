import { SewingLine } from "../sewingLine.js";
import { Sewing } from "../sewing.js";
import { Line } from "../../StoffLib/line.js";
import { FaceCarousel } from "../faceCarousel.js";

export function merge_lines_horizontally(sewing: Sewing, line1: SewingLine, line2: SewingLine): SewingLine;
export function merge_lines_horizontally(sewing: Sewing, ...lines: (SewingLine | Line)[]): SewingLine;
export function merge_lines_horizontally(sewing: Sewing, ...lines: (SewingLine | Line)[]): SewingLine {
    if (lines.length === 1) {
        return lines[0] instanceof SewingLine ? lines[0] : sewing.sewing_line(lines[0]);
    }

    if (lines.length > 2) {
        return merge_lines_horizontally(
            sewing,
            merge_lines_horizontally(sewing, lines[0], lines[1]),
            ...lines.slice(2)
        );
    }

    const line1: SewingLine = lines[0] instanceof Line ? sewing.sewing_line(lines[0]) : lines[0];
    const line2: SewingLine = lines[1] instanceof Line ? sewing.sewing_line(lines[1]) : lines[1];

    line2.set_orientation(line1);
    line2.set_handedness(line1);

    // Combine components
    const primary = line1.primary_component.concat(line2.primary_component)
    const other = line1.other_components.concat(line2.other_components)

    const newSewingLine = new SewingLine(
        sewing,
        primary,
        other,
        null as any
    );

    (newSewingLine as any).face_carousel = FaceCarousel.merge_horizontally(newSewingLine, line1.face_carousel, line2.face_carousel);

    // Remove lines from sewing_lines array
    line1.remove();
    line2.remove();

    // This is non-circular
    newSewingLine.get_endpoints().forEach((endpoint) => {
        endpoint.sewingLines.push(newSewingLine);
    });
    sewing.sewing_lines.push(newSewingLine);
    return newSewingLine;
}