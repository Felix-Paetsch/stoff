import { assert } from "../assert";
import { Sewing } from "../Sewing/sewing";
import { wrap_sewing_methods, wrap_sewing_prototype_methods } from "../Sewing/wrap_sewing_methods";
import { Sketch } from "../StoffLib/sketch";
import { wrap_sketch_methods, wrap_sketch_prototype_methods } from "../StoffLib/sketch_methods/wrap_sketch_methods";
import { EvaluationResult, Toggle } from "../utils/prototype_modification";

export type Recordable = Sketch | Sewing;

const active_recordings: Map<Recordable, LiveRecording<Recordable>> = new Map();

export function start_recording<T extends Recordable>(
    target: T
): LiveRecording<T> {
    assert(!active_recordings.get(target), "Already recording");

    const rec = new LiveRecording(target);
    active_recordings.set(target, rec);

    return rec;
}

export function stop_recording<T extends Recordable>(
    target: T
): LiveRecording<T> {
    const rec = active_recordings.get(target);
    if (!rec) throw assert(!rec, "Not currently recording");

    rec.stop();
    return rec;
}

export function is_recording(target: Recordable): boolean {
    return !!active_recordings.get(target);
}

export function get_recording<T extends Recordable>(
    target: T
): LiveRecording<T> {
    const rec = active_recordings.get(target);
    if (!rec) throw assert(!rec, "Not currently recording");
    return rec as LiveRecording<T>;
}


export class Recording<T extends Recordable = Recordable> {
    protected taking_snapshot: boolean = false;
    readonly snapshots: T[];

    constructor(snapshots: T[] = []) {
        this.snapshots = [...snapshots];
    }

    snapshot(s: T) {
        const cold_snapshot = !this.taking_snapshot;
        if (cold_snapshot) this.taking_snapshot = true;

        const copy = s;

        {
            const old_limit = Error.stackTraceLimit;
            Error.stackTraceLimit = Infinity;

            const error = new Error("");
            const stackTrace =
                "Stack Trace<br>" +
                (error.stack ?? "")
                    .split("\n")
                    .slice(4)
                    .map((s) => s.trim())
                    .join("<br>");
            copy.data["Stack Trace"] = stackTrace;

            Error.stackTraceLimit = old_limit;
        }

        this.snapshots.push(copy);
        if (cold_snapshot) this.taking_snapshot = false;
    }
}

export class LiveRecording<T extends Recordable> extends Recording {
    private toggle: Toggle;

    constructor(record: T, double_shot: boolean = false) {
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
        }
        if (record instanceof Sketch) {
            this.toggle = wrap_sketch_methods(
                record, wrap_method
            )
        } else {
            this.toggle = wrap_sewing_methods(
                record, wrap_method
            )
        }
    }

    stop() {
        this.toggle(false);
    }
}


let global_recording: {
    rec: Recording,
    toggle: Toggle,
    taking_snapshot: boolean
} | null = null;

export function start_global_recording(): Recording {
    assert(!global_recording, "Already recording");
    global_recording = {
        rec: new Recording(),
        toggle: () => true,
        taking_snapshot: false
    }

    const wrapper = (method: () => EvaluationResult, object: Recordable) => {
        if (!global_recording) throw new Error();

        const taking_snapshot = global_recording.taking_snapshot;
        if (!taking_snapshot) global_recording.taking_snapshot = true;

        const result = method();

        if (!taking_snapshot) {
            global_recording.rec.snapshot(object);

            {
                const old_limit = Error.stackTraceLimit;
                Error.stackTraceLimit = Infinity;

                const error = new Error("");
                const stackTrace =
                    "Stack Trace<br>" +
                    (error.stack ?? "")
                        .split("\n")
                        .slice(2)
                        .map((s) => s.trim())
                        .join("<br>");

                const s_data =
                    global_recording.rec.snapshots[
                        global_recording.rec.snapshots.length - 1
                    ]?.data;
                if (s_data) (s_data as any)["Stack Trace"] = stackTrace;

                Error.stackTraceLimit = old_limit;
            }

            global_recording.taking_snapshot = false;
        }

        return result;
    }

    const toggle1 = wrap_sketch_prototype_methods(
        Sketch, wrapper
    );

    const toggle2 = wrap_sewing_prototype_methods(
        Sewing, wrapper
    );

    global_recording.toggle = (to?: boolean) => {
        toggle1(to);
        return toggle2(to);
    }

    return global_recording.rec;
}

export function stop_global_recording(): Recording {
    if (!global_recording) throw assert("Not currently recording");
    const r = global_recording;
    global_recording = null;
    return r.rec;
}

export function get_global_recording(): Recording {
    if (!global_recording) throw assert("Not currently recording");
    return global_recording.rec;
}

export function is_global_recording(): boolean {
    return !!global_recording;
}
