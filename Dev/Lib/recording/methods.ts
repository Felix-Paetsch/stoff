import { Expect, Sketch } from "../../../Core/index";
import {
    EvaluationResult,
    Toggle,
    ToggleState,
} from "../utils/prototype_modification";
import { wrap_sketch_prototype_methods } from "../utils/wrap_sketch_methods";
import { LiveRecording, Recording } from "./recording";

const active_recordings: Map<Sketch, LiveRecording> = new Map();

export function start(target: Sketch): LiveRecording {
    Expect.that(!active_recordings.get(target), "Already recording");

    const rec = new LiveRecording(target);
    active_recordings.set(target, rec);

    return rec;
}

export function stop(target: Sketch): LiveRecording {
    const rec = active_recordings.get(target);
    if (!rec) throw Expect.that(!rec, "Not currently recording");

    rec.stop();
    return rec;
}

export function is_recording(target: Sketch): boolean {
    return !!active_recordings.get(target);
}

export function get_recording(target: Sketch): LiveRecording {
    const rec = active_recordings.get(target);
    if (!rec) throw Expect.that(!rec, "Not currently recording");
    return rec;
}

let global_recording: {
    rec: Recording;
    toggle: Toggle;
    taking_snapshot: boolean;
} | null = null;

export function start_global_recording(): Recording {
    Expect.that(!global_recording, "Already recording");
    global_recording = {
        rec: new Recording(),
        toggle: () => "on",
        taking_snapshot: false,
    };

    global_recording.rec.is_hot = true;

    const wrapper = (method: () => EvaluationResult, object: Sketch) => {
        if (!global_recording)
            throw new Error("There is no global recording currently");

        const taking_snapshot = global_recording.taking_snapshot;
        if (!taking_snapshot) global_recording.taking_snapshot = true;

        const result = method();

        if (!taking_snapshot) {
            global_recording.rec.snapshot(object);
            global_recording.taking_snapshot = false;
        }

        return result;
    };

    const toggle1 = wrap_sketch_prototype_methods(Sketch, wrapper);

    global_recording.toggle = (to?: ToggleState) => {
        const ret = toggle1(to);
        global_recording!.rec.is_hot = ret == "on";
        return ret;
    };

    return global_recording.rec;
}

export function stop_global_recording(): Recording {
    if (!global_recording) throw Expect.that("Not currently recording");
    const r = global_recording;
    global_recording = null;
    return r.rec;
}

export function get_global_recording(): Recording {
    if (!global_recording) throw Expect.that("Not currently recording");
    return global_recording.rec;
}

export function is_global_recording(): boolean {
    return !!global_recording;
}
