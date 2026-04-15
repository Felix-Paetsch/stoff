import { Polyline, Vector } from "Core/geometry/index";
import fs from "node:fs";
import { DST_Stitches } from "./index";

function decode_record(
    b0: number,
    b1: number,
    b2: number,
): {
    dx: number;
    dy: number;
    jump: boolean;
    colorChange: boolean;
    end: boolean;
} {
    let dx = 0;
    let dy = 0;

    // Tajima DST bit decoding
    // X contributions
    if (b0 & 0x01) dx += 1;
    if (b0 & 0x02) dx -= 1;
    if (b0 & 0x04) dx += 9;
    if (b0 & 0x08) dx -= 9;
    if (b1 & 0x01) dx += 3;
    if (b1 & 0x02) dx -= 3;
    if (b1 & 0x04) dx += 27;
    if (b1 & 0x08) dx -= 27;
    if (b2 & 0x04) dx += 81;
    if (b2 & 0x08) dx -= 81;

    // Y contributions
    if (b0 & 0x80) dy += 1;
    if (b0 & 0x40) dy -= 1;
    if (b0 & 0x20) dy += 9;
    if (b0 & 0x10) dy -= 9;
    if (b1 & 0x80) dy += 3;
    if (b1 & 0x40) dy -= 3;
    if (b1 & 0x20) dy += 27;
    if (b1 & 0x10) dy -= 27;
    if (b2 & 0x80) dy += 81;
    if (b2 & 0x40) dy -= 81;

    // Control flags
    const end = (b2 & 0xf3) === 0xf3;
    const colorChange = (b2 & 0xc3) === 0xc3 && !end;
    const jump = (b2 & 0x83) === 0x83 && !colorChange && !end;

    return { dx, dy, jump, colorChange, end };
}

function push_segment(colorRuns: Polyline[], points: Vector[]): Vector[] {
    if (points.length > 0) {
        colorRuns.push(new Polyline(points));
    }
    return [];
}

function push_color(result: DST_Stitches, colorRuns: Polyline[]): Polyline[] {
    if (colorRuns.length > 0) {
        result.push(colorRuns);
    }
    return [];
}

export function parse_dst_file(f: string): DST_Stitches {
    const buf = fs.readFileSync(f);

    if (buf.length < 512) {
        throw new Error("Invalid DST file: file too small");
    }

    const result: DST_Stitches = [];

    let currentColor: Polyline[] = [];
    let currentPoints: Vector[] = [];

    let x = 0;
    let y = 0;

    // DST data begins after 512-byte header
    for (let i = 512; i + 2 < buf.length; i += 3) {
        const b0 = buf[i]!;
        const b1 = buf[i + 1]!;
        const b2 = buf[i + 2]!;

        const { dx, dy, jump, colorChange, end } = decode_record(b0, b1, b2);

        if (end) {
            currentPoints = push_segment(currentColor, currentPoints);
            currentColor = push_color(result, currentColor);
            break;
        }

        x += dx;
        y += dy;

        if (colorChange) {
            currentPoints = push_segment(currentColor, currentPoints);
            currentColor = push_color(result, currentColor);
            continue;
        }

        if (jump) {
            currentPoints = push_segment(currentColor, currentPoints);
            continue;
        }

        currentPoints.push(new Vector(x, y));
    }

    // In case file doesn't terminate cleanly
    currentPoints = push_segment(currentColor, currentPoints);
    currentColor = push_color(result, currentColor);

    return result;
}
