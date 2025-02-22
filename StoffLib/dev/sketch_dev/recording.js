import { create_canvas_from_sketch } from '../../sketch_methods/rendering_methods/to_png_jpg.js';
import { writeFileSync, existsSync, mkdirSync, rmSync, readdirSync, statSync } from 'fs';
import ffmpeg from 'fluent-ffmpeg';
import path from 'path';
import { createCanvas } from 'canvas';
import { dirname } from "path";
import ejs from 'ejs';

import Route from "./request_routing.js";
import clean_rendering_data from "./tools/clean_rendering_data.js";
import load_assets from './tools/load_assets.js';

export default (Sketch) => {
    Sketch.dev.strict_debug_recording = function(){
        new Recorder(this, Sketch, true);
    };

    Sketch.dev.is_recording = function(){
        return !!this.dev.recorder;
    }

    Sketch.dev.start_recording_once = function (...args) {
        if (this.dev.is_recording()) return;
        const r = new Recorder(this, Sketch, false);
        if (args.length == 0) return;
        r.hot_at_url(...args);
    };

    Sketch.dev.snapshot = function () {
        if (!this.dev.is_recording()) { throw new Error("Not recording"); }
        this.dev.recorder.snapshot();
    };

    Sketch.dev.start_recording = function(...args){
        const r = new Recorder(this, Sketch, false);
        if (args.length == 0) return;
        r.hot_at_url(...args);
    };

    Sketch.dev.stop_recording = function(...args){
        const r = this.dev.recorder.stop_recording();
        if (args.length > 0){
            r.at_url(...args);
        }
        return r;
    }

    Sketch.dev.Recording = Recording;

    Sketch.dev.global_recording = function(){
        const global_recording = new Recording();

        const old_methods = {};
        let global_taking_snapshot = false;

        for (const method_name of Sketch.graphical_non_pure_methods) {
            const old_method = Sketch.prototype[method_name];
            old_methods[method_name] = old_method;

            Sketch.prototype[method_name] = function (...args) {
                const taking_snapshot = global_taking_snapshot;
                if (!taking_snapshot) global_taking_snapshot = true;
                if (!taking_snapshot && this.points.length == 0){
                    global_recording.snapshot(this);
                }

                const result = old_method.apply(this, args);

                if (!taking_snapshot){
                    global_recording.snapshot(this);

                    {
                        const old_limit = Error.stackTraceLimit;
                        Error.stackTraceLimit = Infinity;

                        const error = new Error("");
                        const stackTrace = "Stack Trace<br>" + error.stack.split("\n").slice(2).map(s => s.trim()).join("<br>");

                        const s_data = global_recording.snapshots[global_recording.snapshots.length - 1]?.data;
                        if (s_data) s_data["Stack Trace"] = stackTrace;

                        Error.stackTraceLimit = old_limit;
                    }

                    global_taking_snapshot = false;
                }
                return result;
            };
        }

        return global_recording;
    }
}

class Recorder {
    constructor(s, SketchClass, debug) {
        this.taking_snapshot = false;
        this.sketch = s;
        this.debug = debug;
        this.old_methods = {};
        this.snapshots = [];

        if (s.dev.recorder) throw new Error("Sketch already is recording!");
        s.dev.recorder = this;

        for (const method_name of SketchClass.graphical_non_pure_methods) {
            const old_method = s[method_name];
            this.old_methods[method_name] = old_method;

            s[method_name] = function (...args) {
                const taking_snapshot = s.dev.recorder.taking_snapshot;
                if (!taking_snapshot) s.dev.recorder.startSnapshot();
                const result = old_method.apply(s, args);
                if (!taking_snapshot) s.dev.recorder.endSnapshot();
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
            const stackTrace = "Stack Trace<br>" + error.stack.split("\n").slice(4).map(s => s.trim()).join("<br>");
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
        this.sketch.dev.recorder = null;

        for (const method_name of Object.keys(this.old_methods)) {
            this.sketch[method_name] = this.old_methods[method_name].bind(this.sketch);
        }

        return new Recording(this.snapshots).lock();
    }

    hot_at_url(url, overwrite = null){
        const get  = new Route(url, "get",  overwrite);
        const post = new Route(url, "post", overwrite);

        let currently_live = false;

        get.request = (function(){
            currently_live = true;

            const r = new Recording(this.snapshots);
            return r.to_html(url);
        }).bind(this);

        post.request = (function(){
            if (currently_live) {
                return { live: true };
            }

            const r = new Recording(this.snapshots);
            r.process_snapshots(url);
            currently_live = true;
            return {
                live: false,
                render_data: r.render_processed_snapshots
            };
        }).bind(this);
    }
}


// Clear frames files for mp4 Video Creation
const currentDir = process.cwd();
const files = readdirSync(currentDir);
files.forEach(file => {
    const filePath = path.join(currentDir, file);
    if (file.startsWith('___frames') && statSync(filePath).isDirectory()) {
        console.log(`Deleting folder: ${filePath}`);
        rmSync(filePath, { recursive: true });
    }
});

class Recording {
    constructor(snapshots = []) {
        this.snapshots = snapshots;

        this.render_processed_snapshots = [];
        this.locked = false;
        this.last_update_ts = Date.now();
    }

    process_snapshots(url = "StoffLib"){
        //this.lock();
        if (this.render_processed_snapshots.length > 0 || this.snapshots.length == 0) return;

        console.log("Started  Processing Snapshorts for:", url);
        this.render_processed_snapshots = this.snapshots.map(s => { return {
            svg: s.to_dev_svg(500, 500),
            sketch_data: clean_rendering_data(s.data)
        }});
        console.log("Finished Processing Snapshorts for:", url);
    }

    to_html(url) {
        this.process_snapshots(url);

        const assets = load_assets(
            "./DevEnv/DevServer",
            [
                "public/at_url/sketch.css",
                "public/at_url/snapshot.css",
                "views/at_url/recording.ejs",
                "public/at_url/snapshot.js",
                "public/main/add_svg_hover_events.js"
            ]
        );

        const htmlOutput = ejs.render(assets["recording.ejs"], {
            render_data: this.render_processed_snapshots,
            route: url,
            assets
        }, {
            root: dirname("../../../DevEnv/DevServer/views")
        });

        return htmlOutput;
    }

    save_as_html = function(path, title = "/StoffLib"){
        writeFileSync(path, this.to_html(title), 'utf-8');
        return this;
    }

    at_url(url, overwrite = null) {
        this.process_snapshots(url);

        const get  = new Route(url, "get",  overwrite);
        const post = new Route(url, "post", overwrite);

        get.request = (function(){
            return this.to_html(url);
        }).bind(this);

        post.request = (function(req){
            if (this.last_update_ts == req.body.ts) {
                return { 
                    ts: this.last_update_ts,
                    live: true,
                    type: "recording"
                };
            }

            this.process_snapshots(url);
            return {
                ts: this.last_update_ts,
                render_data: this.render_processed_snapshots,
                live: false,
                type: "recording"
            };
        }).bind(this);

        return this;
    }

    hot_at_url(url, overwrite = null){
        return this.at_url(url, overwrite).unlock();
    }

    to_mp4(save_to, fps = 2, width = 700, height = null, extra_padding = 50) {
        console.log("Start Video Creation");

        const outputPath = path.isAbsolute(save_to) ? save_to : path.join('./renders', save_to);

        const timestamp = new Date().toISOString().replace(/:/g, '-');
        const frameDir = `./___frames_${timestamp}`;

        if (!existsSync(frameDir)) {
            mkdirSync(frameDir);
        }

        // Calculate Dimensions for final Video to have frames take on same size
        width = width - 2*extra_padding;
        if (height == null){
            height = 9 * width / 16;
        } else {
            height = height - 2*extra_padding;
        }

        const max_bb = {
            width: 1,
            height: 1
        }

        this.snapshots.forEach(snapshot => {
            const bb = snapshot.get_bounding_box();
            if (bb.width > max_bb.width){
                max_bb.width = bb.width;
            }

            if (bb.height > max_bb.height){
                max_bb.height = bb.height;
            }
        });

        const target_aspect_ratio = max_bb.width/max_bb.height;
        const target_width =  Math.round(Math.min(width, target_aspect_ratio*height));
        const target_height = Math.round(Math.min(height, width/target_aspect_ratio));

        let target_padded_width  = Math.round(target_width + 2 * extra_padding);
        if (target_padded_width%2 == 1) target_padded_width++;
        let target_padded_height = Math.round(target_height + 2 * extra_padding);
        if (target_padded_height%2 == 1) target_padded_height++;

        this.snapshots.forEach((snapshot, index) => {
            const originalCanvas = create_canvas_from_sketch(snapshot, target_width, target_height);

            const enlargedCanvas = createCanvas(target_padded_width, target_padded_height);
            const ctx = enlargedCanvas.getContext('2d');

            ctx.fillStyle = 'white';
            ctx.fillRect(0, 0, enlargedCanvas.width, enlargedCanvas.height);

            const originalWidth = originalCanvas.width;
            const originalHeight = originalCanvas.height;

            ctx.drawImage(originalCanvas, Math.ceil((target_padded_width - originalWidth)/2), Math.ceil((target_padded_height - originalHeight)/2));

            const enlargedBuffer = enlargedCanvas.toBuffer();
            const framePath = `${frameDir}/frame_${String(index).padStart(5, '0')}.png`;

            writeFileSync(framePath, enlargedBuffer);
        });

        console.log("Start FFMpeg");
        const frameDirAbs = path.resolve(frameDir);  // Convert the frame directory to an absolute path
        const outputPathAbs = path.resolve(outputPath);  // Convert the output path to an absolute path

        ffmpeg()
            .addInput(`${frameDirAbs}/frame_%05d.png`)  // Use the absolute path for frames
            .inputOptions([
                `-framerate ${fps}`  // Use fps as a variable
            ])
            .outputOptions([
                '-c:v libx264',       // Specify codec
                '-pix_fmt yuv420p'    // Ensure pixel format compatibility for broader support
            ])
            .on('start', (commandLine) => {
                console.log('Spawned ffmpeg with command: ' + commandLine);
            })
            .on('end', () => {
                console.log(`Video saved to ${outputPathAbs}`);
                rmSync(frameDirAbs, { recursive: true });  // Clean up the frames using the absolute path
            })
            .on('error', (err) => {
                console.error(`Error occurred: ${err.message}`);
            })
            .save(outputPathAbs);
    }

    // Custrom Recording
    snapshot(...s){
        if (this.locked) return;
        return this.append(...s)
    }

    append(...s){
        if (this.locked) return;
        for (const el of s){
            if (el instanceof Recording){
                this.snapshots.push(...el.snapshots);
            } else {
                this.snapshots.push(el.copy());
            }
        }

        this.last_update_ts = Date.now();
        this.render_processed_snapshots = [];
        return this;
    }

    unlock(){
        this.locked = false;
        return this;
    }

    lock(){
        this.locked = true;
        return this;
    }
}
