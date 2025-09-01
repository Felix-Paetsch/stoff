import { SewingLine } from "../sewingLine";
import Line from "../../StoffLib/line.js";

export type FullStackLine = {
    line: SewingLine,
    same_orientation: boolean,
    same_handedness: boolean,
}

export type PartialStackLine = FullStackLine & {
    sewTo: Line[]
}

export type StackLine = FullStackLine | PartialStackLine;
