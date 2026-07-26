import { DST } from "./index";

type CommandKind = "stitch" | "jump" | "color" | "end";

function padLeft(value: string | number, width: number, ch = "0") {
    return String(value).padStart(width, ch);
}

function padRight(value: string, width: number, ch = " ") {
    return value.length >= width
        ? value.slice(0, width)
        : value.padEnd(width, ch);
}

function signedField(value: number, width: number) {
    const sign = value >= 0 ? "+" : "-";
    return `${sign}${padLeft(Math.abs(Math.trunc(value)), width - 1, " ")}`;
}

function quantizeCoord(n: number) {
    const r = n >= 0 ? Math.floor(n + 0.5) : Math.ceil(n - 0.5);
    return Object.is(r, -0) ? 0 : r;
}

function splitAbsoluteMove(
    fromX: number,
    fromY: number,
    toX: number,
    toY: number,
) {
    const totalDx = toX - fromX;
    const totalDy = toY - fromY;

    const steps = Math.max(
        1,
        Math.ceil(Math.max(Math.abs(totalDx), Math.abs(totalDy)) / 121),
    );

    const parts: Array<{ dx: number; dy: number }> = [];
    let prevX = fromX;
    let prevY = fromY;

    for (let i = 1; i <= steps; i++) {
        const nextX =
            i === steps ? toX : quantizeCoord(fromX + (totalDx * i) / steps);
        const nextY =
            i === steps ? toY : quantizeCoord(fromY + (totalDy * i) / steps);

        parts.push({
            dx: nextX - prevX,
            dy: nextY - prevY,
        });

        prevX = nextX;
        prevY = nextY;
    }

    return parts;
}

function encodeRecord(dx: number, dy: number, kind: CommandKind): Buffer {
    if (kind === "end") {
        return Buffer.from([0x00, 0x00, 0xf3]);
    }

    const calculateOffsets = (
        num0: number,
    ): [number, number, number, number, number] => {
        let num = Math.trunc(num0);

        if (num < -121 || num > 121) {
            throw new Error(`DST axis out of range: ${num}`);
        }

        // [pm1, pm3, pm9, pm27, pm81]
        const res: [number, number, number, number, number] = [0, 0, 0, 0, 0];

        if (num > 40) {
            res[4] = 1;
            num -= 81;
        } else if (num < -40) {
            res[4] = -1;
            num += 81;
        }

        if (num > 13) {
            res[3] = 1;
            num -= 27;
        } else if (num < -13) {
            res[3] = -1;
            num += 27;
        }

        if (num > 4) {
            res[2] = 1;
            num -= 9;
        } else if (num < -4) {
            res[2] = -1;
            num += 9;
        }

        if (num > 1) {
            res[1] = 1;
            num -= 3;
        } else if (num < -1) {
            res[1] = -1;
            num += 3;
        }

        if (num > 0) {
            res[0] = 1;
            num -= 1;
        } else if (num < 0) {
            res[0] = -1;
            num += 1;
        }

        if (num !== 0) {
            throw new Error(`Could not encode DST axis exactly: ${num0}`);
        }

        return res;
    };

    const x = calculateOffsets(dx);
    const y = calculateOffsets(dy);

    let b1 = 0;
    let b2 = 0;
    let b3 = 0x03;

    // Byte 1: y+1 y-1 y+9 y-9 - x-9 x+9 x-1 x+1
    if (x[0] === 1) b1 |= 1 << 0;
    if (x[0] === -1) b1 |= 1 << 1;
    if (x[2] === 1) b1 |= 1 << 2;
    if (x[2] === -1) b1 |= 1 << 3;
    if (y[2] === -1) b1 |= 1 << 4;
    if (y[2] === 1) b1 |= 1 << 5;
    if (y[0] === -1) b1 |= 1 << 6;
    if (y[0] === 1) b1 |= 1 << 7;

    // Byte 2: y+3 y-3 y+27 y-27 - x-27 x+27 x-3 x+3
    if (x[1] === 1) b2 |= 1 << 0;
    if (x[1] === -1) b2 |= 1 << 1;
    if (x[3] === 1) b2 |= 1 << 2;
    if (x[3] === -1) b2 |= 1 << 3;
    if (y[3] === -1) b2 |= 1 << 4;
    if (y[3] === 1) b2 |= 1 << 5;
    if (y[1] === -1) b2 |= 1 << 6;
    if (y[1] === 1) b2 |= 1 << 7;

    // Byte 3: c0 c1 y+81 y-81 - x-81 x+81 set set
    if (x[4] === 1) b3 |= 1 << 2;
    if (x[4] === -1) b3 |= 1 << 3;
    if (y[4] === -1) b3 |= 1 << 4;
    if (y[4] === 1) b3 |= 1 << 5;

    if (kind === "jump") {
        b3 |= 1 << 7;
    } else if (kind === "color") {
        b3 |= 1 << 7;
        b3 |= 1 << 6;
    }

    return Buffer.from([b1, b2, b3]);
}

function makeHeader(
    name: string,
    stitchCount: number,
    colorCount: number,
    minX: number,
    maxX: number,
    minY: number,
    maxY: number,
    finalX: number,
    finalY: number,
) {
    const lines = [
        `LA:${padRight(name, 16, " ")}`,
        `ST:${padLeft(stitchCount, 7, "0")}`,
        `CO:${padLeft(colorCount, 3, "0")}`,
        `+X:${padLeft(Math.max(0, maxX), 5, "0")}`,
        `-X:${padLeft(Math.max(0, -minX), 5, "0")}`,
        `+Y:${padLeft(Math.max(0, maxY), 5, "0")}`,
        `-Y:${padLeft(Math.max(0, -minY), 5, "0")}`,
        `AX:${signedField(finalX, 6)}`,
        `AY:${signedField(finalY, 6)}`,
        `MX:${signedField(0, 6)}`,
        `MY:${signedField(0, 6)}`,
        `PD:******`,
    ];

    const headerText = lines.join("\r") + "\r";
    const header = Buffer.alloc(512, 0x20);

    Buffer.from(headerText, "ascii").copy(
        header,
        0,
        0,
        Math.min(512, headerText.length),
    );

    return header;
}

export function write_dst_buffer(dst: DST, name = "Untitled"): Buffer {
    const records: Buffer[] = [];

    let currentX = 0;
    let currentY = 0;

    let minX = 0;
    let maxX = 0;
    let minY = 0;
    let maxY = 0;

    const updateBounds = () => {
        minX = Math.min(minX, currentX);
        maxX = Math.max(maxX, currentX);
        minY = Math.min(minY, currentY);
        maxY = Math.max(maxY, currentY);
    };

    const emitAbsoluteTo = (
        x01mm: number,
        y01mm: number,
        kind: "stitch" | "jump",
    ) => {
        const targetX = quantizeCoord(x01mm);
        const targetY = quantizeCoord(y01mm);

        if (targetX === currentX && targetY === currentY) {
            return;
        }

        for (const part of splitAbsoluteMove(
            currentX,
            currentY,
            targetX,
            targetY,
        )) {
            if (part.dx === 0 && part.dy === 0) continue;

            records.push(encodeRecord(part.dx, part.dy, kind));
            currentX += part.dx;
            currentY += part.dy;
            updateBounds();
        }
    };

    const emitJumpTo = (x01mm: number, y01mm: number) => {
        emitAbsoluteTo(x01mm, y01mm, "jump");
    };
    const emitStitchTo = (x01mm: number, y01mm: number) => {
        emitAbsoluteTo(x01mm, y01mm, "stitch");
    };

    const emitTrim = () => {
        const trimSeq = [
            { dx: 2, dy: 2 },
            { dx: -4, dy: -4 },
            { dx: 2, dy: 2 },
        ];

        for (const s of trimSeq) {
            records.push(encodeRecord(s.dx, s.dy, "jump"));
            currentX += s.dx;
            currentY += s.dy;
            updateBounds();
        }
    };

    for (let ti = 0; ti < dst.threads.length; ti++) {
        const thread = dst.threads[ti]!;

        for (const polyline of thread) {
            const verts = polyline.vertices ?? [];
            if (verts.length === 0) continue;

            emitJumpTo(verts[0]!.x, verts[0]!.y);
            emitStitchTo(verts[0]!.x, verts[0]!.y);

            for (let i = 1; i < verts.length; i++) {
                const v = verts[i]!;
                emitStitchTo(v.x, v.y);
            }

            emitTrim();
        }

        if (ti < dst.threads.length - 1) {
            records.push(encodeRecord(0, 0, "color"));
            updateBounds();
        }
    }

    records.push(encodeRecord(0, 0, "end"));

    const header = makeHeader(
        name,
        records.length,
        Math.max(0, dst.threads.length - 1),
        minX,
        maxX,
        minY,
        maxY,
        currentX,
        currentY,
    );

    return Buffer.concat([header, ...records]);
}
