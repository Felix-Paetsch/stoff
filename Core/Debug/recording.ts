import { create_canvas_from_sketch } from "../StoffLib/sketch_methods/rendering_methods/to_png_jpg.js";
import {
    writeFileSync,
    existsSync,
    mkdirSync,
    rmSync,
    readdirSync,
    statSync,
} from "fs";
import ffmpeg from "fluent-ffmpeg";
import path from "path";
import { createCanvas } from "canvas";

import Sketch from "../StoffLib/sketch.js";
import { at_url, hot_at_url } from "./render_at.js";

export type RecordingSketch = Sketch & { recorder?: Recorder };

export function is_recording(sketch: RecordingSketch) {
    return !!sketch.recorder;
}

export function start_recording(sketch: RecordingSketch, url?: `/${string}`, overwrite: boolean | null = null) {
    if (is_recording(sketch)) return;
    const r = new Recorder(sketch, false);
    if (url) r.hot_at_url(url, overwrite);
    return r;
}

export function take_snapshot(sketch: RecordingSketch) {
    if (!is_recording(sketch)) {
        throw new Error("Not recording");
    }
    sketch.recorder!.snapshot();
}
export function stop_recording(sketch: RecordingSketch, url?: `/${string}`, overwrite: boolean | null = null) {
    if (!is_recording(sketch)) {
        throw new Error("Not recording");
    }
    const r = sketch.recorder!.stop_recording();
    if (url) {
        r.at_url(url, overwrite);
    }
    return r;
}

export function global_recording() {
    const global_recording = new Recording();

    const old_methods: any = {};
    let global_taking_snapshot = false;

    const s = Sketch as any;
    for (const method_name of s.graphical_non_pure_methods) {
        const old_method = s.prototype[method_name];
        old_methods[method_name] = old_method;

        s.prototype[method_name] = function (...args: any[]) {
            const taking_snapshot = global_taking_snapshot;
            if (!taking_snapshot) global_taking_snapshot = true;
            if (!taking_snapshot && this.points.length == 0) {
                global_recording.snapshot(this);
            }

            const result = old_method.apply(this, args);

            if (!taking_snapshot) {
                global_recording.snapshot(this);

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
                        global_recording.snapshots[
                            global_recording.snapshots.length - 1
                        ]?.data;
                    if (s_data) (s_data as any)["Stack Trace"] = stackTrace;

                    Error.stackTraceLimit = old_limit;
                }

                global_taking_snapshot = false;
            }
            return result;
        };
    }

    return global_recording;
};

export class Recorder {
    private taking_snapshot: boolean;
    private old_methods: Record<string, (...args: any[]) => any>;
    readonly snapshots: Sketch[];

    constructor(
        readonly sketch: RecordingSketch,
        readonly debug: boolean
    ) {
        this.taking_snapshot = false;
        this.old_methods = {};
        this.snapshots = [];

        if (sketch.recorder) throw new Error("Sketch already is recording!");
        sketch.recorder = this;

        const s = sketch as any;
        for (const method_name of s.constructor.graphical_non_pure_methods) {
            const old_method = s[method_name];
            this.old_methods[method_name] = old_method;

            s[method_name] = function (...args: any[]) {
                const taking_snapshot = s.recorder.taking_snapshot;
                if (!taking_snapshot) s.recorder.startSnapshot();
                const result = old_method.apply(s, args);
                if (!taking_snapshot) s.recorder.endSnapshot();
                return result;
            };
        }

        this.snapshot();
    }

    snapshot() {
        const cold_snapshot = !this.taking_snapshot;
        if (cold_snapshot) this.taking_snapshot = true;

        const copy = this.sketch.copy();

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

    startSnapshot() {
        this.taking_snapshot = true;
        if (this.debug) this.snapshot();
    }

    endSnapshot() {
        this.taking_snapshot = false;
        this.snapshot();
    }

    stop_recording() {
        this.sketch.recorder = undefined;

        const s = this.sketch as any;
        for (const method_name of Object.keys(this.old_methods)) {
            s[method_name] = this.old_methods[method_name].bind(s);
        }

        return new Recording(this.snapshots).lock();
    }

    hot_at_url(url: `/${string}`, overwrite: boolean | null = null) {
        hot_at_url(this.snapshots, url, overwrite);
    }
}

const currentDir = process.cwd();
const files = readdirSync(currentDir);
files.forEach((file) => {
    const filePath = path.join(currentDir, file);
    if (file.startsWith("___frames") && statSync(filePath).isDirectory()) {
        console.log(`Deleting folder: ${filePath}`);
        rmSync(filePath, { recursive: true });
    }
});

class Recording {
    private render_processed_snapshots: any[];
    private locked: boolean;

    constructor(
        readonly snapshots: Sketch[] = []
    ) {
        this.render_processed_snapshots = [];
        this.locked = true;
    }

    at_url(url: `/${string}`, overwrite: boolean | null = null) {
        at_url(this.snapshots, url, overwrite);
    }

    hot_at_url(url: `/${string}`, overwrite = null) {
        this.unlock();
        return hot_at_url(this.snapshots, url, overwrite);
    }

    to_mp4(
        save_to: string,
        fps: number = 2,
        width: number = 700,
        height: number | null = null,
        extra_padding: number = 50
    ) {
        console.log("Start Video Creation");

        const outputPath = path.isAbsolute(save_to)
            ? save_to
            : path.join("./renders", save_to);

        const timestamp = new Date().toISOString().replace(/:/g, "-");
        const frameDir = `./___frames_${timestamp}`;

        if (!existsSync(frameDir)) {
            mkdirSync(frameDir);
        }

        // Calculate Dimensions for final Video to have frames take on same size
        width = width - 2 * extra_padding;
        if (height == null) {
            height = (9 * width) / 16;
        } else {
            height = height - 2 * extra_padding;
        }

        const max_bb = {
            width: 1,
            height: 1,
        };

        this.snapshots.forEach((snapshot: any) => {
            const bb = snapshot.get_bounding_box();
            if (bb.width > max_bb.width) {
                max_bb.width = bb.width;
            }

            if (bb.height > max_bb.height) {
                max_bb.height = bb.height;
            }
        });

        const target_aspect_ratio = max_bb.width / max_bb.height;
        const target_width = Math.round(
            Math.min(width, target_aspect_ratio * height)
        );
        const target_height = Math.round(
            Math.min(height, width / target_aspect_ratio)
        );

        let target_padded_width = Math.round(target_width + 2 * extra_padding);
        if (target_padded_width % 2 == 1) target_padded_width++;
        let target_padded_height = Math.round(
            target_height + 2 * extra_padding
        );
        if (target_padded_height % 2 == 1) target_padded_height++;

        this.snapshots.forEach((snapshot, index) => {
            const originalCanvas = create_canvas_from_sketch(
                snapshot,
                target_width,
                target_height
            );

            const enlargedCanvas = createCanvas(
                target_padded_width,
                target_padded_height
            );
            const ctx = enlargedCanvas.getContext("2d");

            ctx.fillStyle = "white";
            ctx.fillRect(0, 0, enlargedCanvas.width, enlargedCanvas.height);

            const originalWidth = originalCanvas.width;
            const originalHeight = originalCanvas.height;

            ctx.drawImage(
                originalCanvas,
                Math.ceil((target_padded_width - originalWidth) / 2),
                Math.ceil((target_padded_height - originalHeight) / 2)
            );

            const enlargedBuffer = enlargedCanvas.toBuffer();
            const framePath = `${frameDir}/frame_${String(index).padStart(5, "0")}.png`;

            writeFileSync(framePath, enlargedBuffer);
        });

        console.log("Start FFMpeg");
        const frameDirAbs = path.resolve(frameDir); // Convert the frame directory to an absolute path
        const outputPathAbs = path.resolve(outputPath); // Convert the output path to an absolute path

        ffmpeg()
            .addInput(`${frameDirAbs}/frame_%05d.png`) // Use the absolute path for frames
            .inputOptions([
                `-framerate ${fps}`, // Use fps as a variable
            ])
            .outputOptions([
                "-c:v libx264", // Specify codec
                "-pix_fmt yuv420p", // Ensure pixel format compatibility for broader support
            ])
            .on("start", (commandLine) => {
                console.log("Spawned ffmpeg with command: " + commandLine);
            })
            .on("end", () => {
                console.log(`Video saved to ${outputPathAbs}`);
                rmSync(frameDirAbs, { recursive: true }); // Clean up the frames using the absolute path
            })
            .on("error", (err) => {
                console.error(`Error occurred: ${err.message}`);
            })
            .save(outputPathAbs);
    }

    // Custrom Recording
    snapshot(...s: (Recording | Sketch)[]) {
        if (this.locked) return;
        return this.append(...s);
    }

    append(...s: (Recording | Sketch)[]) {
        if (this.locked) return;
        for (const el of s) {
            if (el instanceof Recording) {
                this.snapshots.push(...el.snapshots);
            } else {
                this.snapshots.push(el.copy());
            }
        }

        this.render_processed_snapshots = [];
        return this;
    }

    unlock() {
        this.locked = false;
        return this;
    }

    lock() {
        this.locked = true;
        return this;
    }
}
