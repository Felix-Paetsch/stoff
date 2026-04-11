import { Sketch } from "../../../Core/index";
import { get_trace } from "../../../Core/utils/trace";
import { EvaluationResult, Toggle } from "../utils/prototype_modification";
import { wrap_sketch_methods } from "../utils/wrap_sketch_methods";
import { Snapshot } from "./types";

export class Recording {
    protected taking_snapshot: boolean = false;
    readonly snapshots: Snapshot[];

    constructor(snapshots: Snapshot[] = []) {
        this.snapshots = [...snapshots];
    }

    snapshot(s: Sketch, annotation: any = null, stack_trace_slice: number = 6) {
        const cold_snapshot = !this.taking_snapshot;
        if (cold_snapshot) this.taking_snapshot = true;

        const copy = s.copy().sketch;

        const stackTrace = get_trace(stack_trace_slice);

        this.snapshots.push({
            sketch: copy,
            stackTrace,
            annotation,
        });
        if (cold_snapshot) this.taking_snapshot = false;
    }
}

export class LiveRecording extends Recording {
    private toggle: Toggle;

    constructor(record: Sketch, double_shot: boolean = false) {
        super();

        const r = this;
        const wrap_method = (ev: () => EvaluationResult) => {
            const taking_snapshot = r.taking_snapshot;
            if (!taking_snapshot) {
                r.taking_snapshot = true;
                if (double_shot) r.snapshot(record);
            }
            const result = ev();
            if (!taking_snapshot) {
                r.taking_snapshot = false;
                r.snapshot(record);
            }
            return result;
        };

        if (record instanceof Sketch) {
            this.toggle = wrap_sketch_methods(record, wrap_method);
        } else {
            throw new Error("Unimplemented");
        }
    }

    stop() {
        this.toggle(false);
    }

    start() {
        this.toggle(true);
    }
}
