import { Sketch } from "../../../Core/index";
import { Json } from "../../../Core/types";

export type Snapshot = {
    sketch: Sketch;
    stackTrace: string;
    annotation: Json;
};
