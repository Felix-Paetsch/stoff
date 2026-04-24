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
    return `${sign}${padLeft(Math.abs(Math.round(value)), width - 1, " ")}`;
}

function roundCoord(n: number) {
    return Math.round(n);
}

function splitRelative(dx: number, dy: number) {
    const steps = Math.max(
        1,
        Math.ceil(Math.max(Math.abs(dx), Math.abs(dy)) / 121),
    );

    const parts: Array<{ dx: number; dy: number }> = [];
    let usedX = 0;
    let usedY = 0;

    for (let i = 0; i < steps; i++) {
        const remainingSteps = steps - i;
        const partX = Math.round((dx - usedX) / remainingSteps);
        const partY = Math.round((dy - usedY) / remainingSteps);
        parts.push({ dx: partX, dy: partY });
        usedX += partX;
        usedY += partY;
    }

    return parts;
}

function encodeRecord(dx0: number, dy0: number, kind: CommandKind): Buffer {
    if (kind === "end") {
        return Buffer.from([0x00, 0x00, 0xf3]);
    }

    let dx = dx0;
    let dy = dy0;

    if (Math.abs(dx) > 121 || Math.abs(dy) > 121) {
        throw new Error(`DST record out of range: dx=${dx}, dy=${dy}`);
    }

    let b1 = 0;
    let b2 = 0;
    let b3 = 0x03;

    const apply = (
        amount: number,
        axis: "x" | "y",
        positiveBit: [1 | 2 | 3, number],
        negativeBit: [1 | 2 | 3, number],
    ) => {
        const target = axis === "x" ? "x" : "y";
        let v = target === "x" ? dx : dy;

        const setBit = ([byteIndex, bit]: [1 | 2 | 3, number]) => {
            if (byteIndex === 1) b1 |= 1 << bit;
            else if (byteIndex === 2) b2 |= 1 << bit;
            else b3 |= 1 << bit;
        };

        while (v >= amount) {
            setBit(positiveBit);
            v -= amount;
        }
        while (v <= -amount) {
            setBit(negativeBit);
            v += amount;
        }

        if (target === "x") dx = v;
        else dy = v;
    };

    apply(81, "x", [3, 2], [3, 3]);
    apply(27, "x", [2, 2], [2, 3]);
    apply(9, "x", [1, 2], [1, 3]);
    apply(3, "x", [2, 0], [2, 1]);
    apply(1, "x", [1, 0], [1, 1]);

    apply(81, "y", [3, 5], [3, 4]);
    apply(27, "y", [2, 5], [2, 4]);
    apply(9, "y", [1, 5], [1, 4]);
    apply(3, "y", [2, 7], [2, 6]);
    apply(1, "y", [1, 7], [1, 6]);

    if (dx !== 0 || dy !== 0) {
        throw new Error(
            `Could not encode DST delta exactly: dx=${dx}, dy=${dy}`,
        );
    }

    if (kind === "jump") {
        b3 |= 1 << 7;
    } else if (kind === "color") {
        b3 |= 1 << 7;
        b3 |= 1 << 6;
    }

    return Buffer.from([b1, b2, b3]);
}

function makeHeader(
    dst: DST,
    name: string,
    stitchCount: number,
    colorCount: number,
) {
    const runs = dst.runs;
    const allPoints = runs.flatMap((r) => r.vertices ?? []);

    let minX = 0;
    let maxX = 0;
    let minY = 0;
    let maxY = 0;

    if (allPoints.length > 0) {
        let minX = Infinity;
        let maxX = -Infinity;
        let minY = Infinity;
        let maxY = -Infinity;

        for (let i = 0; i < allPoints.length; i++) {
            const x = roundCoord(allPoints[i]!.x);
            const y = roundCoord(allPoints[i]!.y);

            minX = Math.min(minX, x);
            maxX = Math.max(maxX, x);
            minY = Math.min(minY, y);
            maxY = Math.max(maxY, y);
        }
    }

    const first = allPoints[0];
    const last = allPoints[allPoints.length - 1];

    const ax = first && last ? roundCoord(last.x) - roundCoord(first.x) : 0;
    const ay = first && last ? roundCoord(last.y) - roundCoord(first.y) : 0;

    const lines = [
        `LA:${padRight(name, 16, " ")}`,
        `ST:${padLeft(stitchCount, 7, "0")}`,
        `CO:${padLeft(colorCount, 3, "0")}`,
        `+X:${padLeft(Math.max(0, maxX), 5, "0")}`,
        `-X:${padLeft(Math.max(0, -minX), 5, "0")}`,
        `+Y:${padLeft(Math.max(0, maxY), 5, "0")}`,
        `-Y:${padLeft(Math.max(0, -minY), 5, "0")}`,
        `AX:${signedField(ax, 6)}`,
        `AY:${signedField(ay, 6)}`,
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

    const emitMove = (dx: number, dy: number, kind: "stitch" | "jump") => {
        for (const part of splitRelative(dx, dy)) {
            records.push(encodeRecord(part.dx, part.dy, kind));
            currentX += part.dx;
            currentY += part.dy;
        }
    };

    const emitJumpTo = (x: number, y: number) => {
        const dx = x - currentX;
        const dy = y - currentY;
        emitMove(dx, dy, "jump");
    };

    const emitStitchTo = (x: number, y: number) => {
        const dx = x - currentX;
        const dy = y - currentY;
        emitMove(dx, dy, "stitch");
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
        }
    };

    for (let ti = 0; ti < dst.threads.length; ti++) {
        const thread = dst.threads[ti]!;

        for (const polyline of thread) {
            const verts = polyline.vertices ?? [];
            if (verts.length === 0) continue;

            const startX = roundCoord(verts[0]!.x);
            const startY = roundCoord(verts[0]!.y);

            emitJumpTo(startX, startY);

            for (let i = 1; i < verts.length; i++) {
                const v = verts[i]!;
                emitStitchTo(roundCoord(v.x), roundCoord(v.y));
            }

            emitTrim();
        }

        if (ti < dst.threads.length - 1) {
            records.push(encodeRecord(0, 0, "color"));
        }
    }

    records.push(encodeRecord(0, 0, "end"));

    const header = makeHeader(
        dst,
        name,
        records.length,
        Math.max(0, dst.threads.length - 1),
    );

    return Buffer.concat([header, ...records]);
}
