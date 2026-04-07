import { expect } from "../expect";
import { EPS } from "./eps";
import { Length, Radians } from "./types";

export type Triangle = {
    a: Length;
    b: Length;
    c: Length;
    alpha: Radians;
    beta: Radians;
    gamma: Radians;
};

export type TriangleSpecification =
    | { a: Length; b: Length; c: Length }
    | { a: Length; b: Length; gamma: Radians }
    | { a: Length; c: Length; beta: Radians }
    | { b: Length; c: Length; alpha: Radians }
    | { a: Length; alpha: Radians; beta: Radians }
    | { a: Length; alpha: Radians; gamma: Radians }
    | { b: Length; beta: Radians; alpha: Radians }
    | { b: Length; beta: Radians; gamma: Radians }
    | { c: Length; gamma: Radians; alpha: Radians }
    | { c: Length; gamma: Radians; beta: Radians }
    | { a: Length; b: Length; alpha: Radians; SSA?: boolean }
    | { a: Length; c: Length; alpha: Radians; SSA?: boolean }
    | { b: Length; a: Length; beta: Radians; SSA?: boolean }
    | { b: Length; c: Length; beta: Radians; SSA?: boolean }
    | { c: Length; a: Length; gamma: Radians; SSA?: boolean }
    | { c: Length; b: Length; gamma: Radians; SSA?: boolean }
    | { alpha: Radians; beta: Radians; gamma: Radians };

type SideKey = "a" | "b" | "c";
type AngleKey = "alpha" | "beta" | "gamma";

function oppositeAngle(side: SideKey): AngleKey {
    return side === "a" ? "alpha" : side === "b" ? "beta" : "gamma";
}

function oppositeSide(angle: AngleKey): SideKey {
    return angle === "alpha" ? "a" : angle === "beta" ? "b" : "c";
}

export function triangle_data(triangle: TriangleSpecification): Triangle {
    const { SSA = true, ...input } = triangle as TriangleSpecification & {
        SSA?: boolean;
    };

    const data: Partial<Triangle> = {};
    for (const k in input) {
        data[k.toLowerCase() as keyof Triangle] =
            input[k as keyof typeof input];
    }

    let A = data.a;
    let B = data.b;
    let C = data.c;
    let Alpha = data.alpha;
    let Beta = data.beta;
    let Gamma = data.gamma;

    if (
        [A, B, C, Alpha, Beta, Gamma].filter((v) => v !== undefined).length < 3
    ) {
        throw new Error("At least three triangle parameters are required");
    }

    /* ------------------------------ SSA handling ------------------------------ */

    {
        const sides: Record<SideKey, number | undefined> = { a: A, b: B, c: C };
        const angles: Record<AngleKey, number | undefined> = {
            alpha: Alpha,
            beta: Beta,
            gamma: Gamma,
        };

        const knownSides = (Object.keys(sides) as SideKey[]).filter(
            (k) => sides[k] !== undefined,
        );
        const knownAngles = (Object.keys(angles) as AngleKey[]).filter(
            (k) => angles[k] !== undefined,
        );

        if (knownSides.length === 2 && knownAngles.length === 1) {
            const angle = knownAngles[0]!;
            const opposite = oppositeSide(angle);

            if (sides[opposite] !== undefined) {
                const otherSide = knownSides.find((s) => s !== opposite)!;
                const ratio =
                    (sides[otherSide]! * Math.sin(angles[angle]!)) /
                    sides[opposite]!;

                if (ratio < -1 || ratio > 1) {
                    throw new Error("Invalid SSA triangle");
                }

                const a1 = Math.asin(ratio);
                const a2 = Math.PI - a1;
                const chosen = SSA ? Math.min(a1, a2) : Math.max(a1, a2);

                angles[oppositeAngle(otherSide)] = chosen;

                const thirdAngle = (
                    ["alpha", "beta", "gamma"] as AngleKey[]
                ).find((k) => angles[k] === undefined)!;
                angles[thirdAngle] = Math.PI - angles[angle]! - chosen;

                A = sides.a;
                B = sides.b;
                C = sides.c;
                Alpha = angles.alpha;
                Beta = angles.beta;
                Gamma = angles.gamma;
            }
        }
    }

    /* -------------------------- Normalize scale-only -------------------------- */

    if (A === undefined && B === undefined && C === undefined) {
        A = 1;
    }

    /* ----------------------------- Iterative solve ---------------------------- */

    let changed: boolean;

    do {
        changed = false;

        const sides: Record<SideKey, number | undefined> = { a: A, b: B, c: C };
        const angles: Record<AngleKey, number | undefined> = {
            alpha: Alpha,
            beta: Beta,
            gamma: Gamma,
        };

        /* -------- Angle sum -------- */
        const knownAngles = (Object.keys(angles) as AngleKey[]).filter(
            (k) => angles[k] !== undefined,
        );
        if (knownAngles.length === 2) {
            const missing = (["alpha", "beta", "gamma"] as AngleKey[]).find(
                (k) => angles[k] === undefined,
            )!;
            angles[missing] =
                Math.PI - angles[knownAngles[0]!]! - angles[knownAngles[1]!]!;
            changed = true;
        }

        /* -------- Law of Sines: sides -------- */
        for (const s of ["a", "b", "c"] as SideKey[]) {
            if (
                sides[s] === undefined &&
                angles[oppositeAngle(s)] !== undefined
            ) {
                const known = (["a", "b", "c"] as SideKey[]).find(
                    (k) =>
                        sides[k] !== undefined &&
                        angles[oppositeAngle(k)] !== undefined,
                );
                if (known) {
                    sides[s] =
                        (sides[known]! * Math.sin(angles[oppositeAngle(s)]!)) /
                        Math.sin(angles[oppositeAngle(known)]!);
                    changed = true;
                }
            }
        }

        /* -------- Law of Sines: angles -------- */
        for (const aKey of ["alpha", "beta", "gamma"] as AngleKey[]) {
            const sKey = oppositeSide(aKey);
            if (angles[aKey] === undefined && sides[sKey] !== undefined) {
                const known = (["a", "b", "c"] as SideKey[]).find(
                    (k) =>
                        sides[k] !== undefined &&
                        angles[oppositeAngle(k)] !== undefined,
                );
                if (known) {
                    const ratio =
                        (sides[sKey]! *
                            Math.sin(angles[oppositeAngle(known)]!)) /
                        sides[known]!;
                    if (ratio >= -1 && ratio <= 1) {
                        angles[aKey] = Math.asin(ratio);
                        changed = true;
                    }
                }
            }
        }

        /* -------- Law of Cosines: sides -------- */
        if (A && B && Gamma && !C) {
            C = Math.sqrt(A ** 2 + B ** 2 - 2 * A * B * Math.cos(Gamma));
            changed = true;
        }
        if (A && C && Beta && !B) {
            B = Math.sqrt(A ** 2 + C ** 2 - 2 * A * C * Math.cos(Beta));
            changed = true;
        }
        if (B && C && Alpha && !A) {
            A = Math.sqrt(B ** 2 + C ** 2 - 2 * B * C * Math.cos(Alpha));
            changed = true;
        }

        /* -------- Law of Cosines: angles -------- */
        if (A && B && C) {
            if (!Alpha) {
                Alpha = Math.acos((B ** 2 + C ** 2 - A ** 2) / (2 * B * C));
                changed = true;
            }
            if (!Beta) {
                Beta = Math.acos((A ** 2 + C ** 2 - B ** 2) / (2 * A * C));
                changed = true;
            }
            if (!Gamma) {
                Gamma = Math.acos((A ** 2 + B ** 2 - C ** 2) / (2 * A * B));
                changed = true;
            }
        }
    } while (changed);

    /* ------------------------------ Validation ------------------------------ */

    expect(
        A !== undefined &&
            B !== undefined &&
            C !== undefined &&
            Alpha !== undefined &&
            Beta !== undefined &&
            Gamma !== undefined,
        "Triangle could not be fully resolved",
    );

    if (Math.abs(Alpha! + Beta! + Gamma! - Math.PI) > EPS.MEDIUM) {
        throw new Error("Invalid triangle");
    }

    return {
        a: A!,
        b: B!,
        c: C!,
        alpha: Alpha!,
        beta: Beta!,
        gamma: Gamma!,
    };
}
