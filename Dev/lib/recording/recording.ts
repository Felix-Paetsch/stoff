import { Sketch, Utils } from "../../../Core/index";
import { EvaluationResult, Toggle } from "../utils/prototype_modification";
import { wrap_sketch_methods } from "../utils/wrap_sketch_methods";
import { Snapshot } from "./types";

export class Recording {
    public is_hot: boolean = false;

    protected taking_snapshot: boolean = false;
    readonly snapshots: Snapshot[];

    constructor(snapshots: Snapshot[] = []) {
        this.snapshots = [...snapshots];
    }

    snapshot(s: Sketch, stack_trace_slice: number = 3) {
        const cold_snapshot = !this.taking_snapshot;
        if (cold_snapshot) this.taking_snapshot = true;

        const copy = s.copy().sketch;

        const stackTrace = Utils.stack_trace(stack_trace_slice);

        this.snapshots.push({
            sketch: copy,
            stackTrace,
        });
        if (cold_snapshot) this.taking_snapshot = false;
    }
}

export class LiveRecording extends Recording {
    private toggle: Toggle;
    public override is_hot: boolean = true;

    constructor(
        record: Sketch,
        double_shot: "snap_before_and_after" | "snap_after" = "snap_after",
    ) {
        super();

        const r = this;
        const wrap_method = (ev: () => EvaluationResult) => {
            const taking_snapshot = r.taking_snapshot;
            if (!taking_snapshot) {
                r.taking_snapshot = true;
                if (double_shot == "snap_before_and_after") r.snapshot(record);
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
        this.is_hot = false;
        this.toggle("off");
    }

    start() {
        this.is_hot = true;
        this.toggle("on");
    }
}
