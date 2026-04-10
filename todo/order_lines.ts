export function order_by_endpoints(...lines: Line[]): {
    lines: Line[];
    points: Point[];
    orientations: boolean[];
} {
    if (Array.isArray(lines[0])) {
        lines = [...lines[0]];
    }
    if (lines.length == 0) {
        return {
            lines: [],
            points: [],
            orientations: [],
        };
    }
    if (lines.length == 1) {
        return {
            lines: lines,
            points: lines[0]!.get_endpoints(),
            orientations: [true],
        };
    }
    if (lines.length == 2)
        return set_two_line_orientations({
            lines: lines,
        });

    const res: {
        lines: Line[];
        points: Point[];
        orientations: boolean[];
    } = {
        lines: [],
        points: [],
        orientations: [],
    };

    res.lines.push(lines.pop()!);
    res.orientations = [true];
    res.points = [res.lines[0]!.p1, res.lines[0]!.p2];

    let smth_found: boolean = false;
    while (lines.length > 0) {
        for (let i = lines.length - 1; i >= 0; i--) {
            if (res.lines[0]!.common_endpoint(lines[i]!)) {
                // Prepend
                smth_found = true;
                res.lines.unshift(...lines.splice(i, 1));
                if (res.lines.length == 2) {
                    set_two_line_orientations(res);
                } else {
                    const next_orientation = res.orientations[0];
                    res.orientations.unshift(
                        res.lines[1]![next_orientation ? "p1" : "p2"] ==
                            res.lines[0]!.p2,
                    );
                    res.points.unshift(
                        res.lines[0]!.other_endpoint(res.points[0]!),
                    );
                }
            } else if (
                res.lines[res.lines.length - 1]!.common_endpoint(lines[i]!)
            ) {
                // Append
                smth_found = true;
                res.lines.push(...lines.splice(i, 1));
                if (res.lines.length == 2) {
                    set_two_line_orientations(res);
                } else {
                    const prev_orientation =
                        res.orientations[res.orientations.length - 1];
                    res.orientations.push(
                        res.lines[res.lines.length - 2]![
                            prev_orientation ? "p2" : "p1"
                        ] == res.lines[res.lines.length - 1]!.p1,
                    );
                    res.points.push(
                        res.lines[res.lines.length - 1]!.other_endpoint(
                            res.points[res.points.length - 1]!,
                        ),
                    );
                }
            }
        }

        expect(smth_found, "Lines dotn form a connected segment");
    }

    function set_two_line_orientations(data: {
        lines: Line[];
        points?: Point[];
        orientations?: boolean[];
    }): {
        lines: Line[];
        points: Point[];
        orientations: boolean[];
    } {
        const l0 = data.lines[0]!;
        const l1 = data.lines[1]!;

        if (l1.has_endpoint(l0.p2)) {
            data.orientations = [true, l1.p1 == l0.p2];
            data.points = [l0.p1, l0.p2, l1.other_endpoint(l0.p2)];
        } else if (l1.has_endpoint(l0.p1)) {
            data.orientations = [false, l1.p1 == l0.p1];
            data.points = [l0.p2, l0.p1, l1.other_endpoint(l0.p1)];
        } else {
            expect(invalid_path("Lines dont form a connected segment"));
        }

        return data as any;
    }

    return res;
}

export function oriented_circle(lines: Line[]): {
    lines: Line[]; // Im Uhrzeigersinn
    points: Point[]; // Im Uhrzeigersinn, startend mit dem Endpunkt der ersten Linie am weitersten vorne im Uhrzeigersinn
    orientations: boolean[]; // Für jede Linie ob p1 -> p2 im Uhrzeigersinn verläuft
} {
    const ordered_lines = Line.order_by_endpoints(...lines);
    expect(
        ordered_lines.points[0] ==
            ordered_lines.points[ordered_lines.points.length - 1],
        "Lines dont form circle",
    );

    // We assume no self-intersection
    const orientation = polygon_orientation(ordered_lines.points.slice(1));
    if (!orientation) {
        ordered_lines.lines.reverse();
        ordered_lines.points.reverse();
        ordered_lines.orientations.reverse();
        ordered_lines.orientations = ordered_lines.orientations.map((o) => !o);
    }

    ordered_lines.points.shift();
    ordered_lines.orientations.shift();

    return ordered_lines;
}
