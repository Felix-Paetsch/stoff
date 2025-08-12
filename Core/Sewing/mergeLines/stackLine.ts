import { SewingLine } from "../sewingLine";

export type FullStackLine = {
    line: SewingLine,
    same_orientation: boolean,
    same_handedness: boolean,
}

export type PartialStackLine = FullStackLine & {
    guideLineRange: [number, number],
    stackLineRange: [number, number]
}

export type StackLine = FullStackLine | PartialStackLine;
