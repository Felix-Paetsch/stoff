import { create_canvas_from_sketch } from '../../sketch_methods/rendering_methods/to_png_jpg.js';
import { writeFileSync, existsSync, mkdirSync, rmdirSync } from 'fs';
import ffmpeg from 'fluent-ffmpeg';
import path from 'path';
import { createCanvas } from 'canvas';

export default (Sketch) => {
    Sketch.dev.start_recording = function(debug = false){
        new Recorder(this, Sketch, debug);
    };

    Sketch.dev.stop_recording = function(){
        return this.dev.recorder.stop_recording();
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
                const taking_snapshot = this.dev.recorder.taking_snapshot;
                if (!taking_snapshot) this.dev.recorder.startSnapshot();
                const result = old_method.apply(this, args);
                if (!taking_snapshot) this.dev.recorder.endSnapshot();
                return result;
            };
        }

        this.snapshot();
    }

    snapshot() {
        const cold_snapshot = !this.taking_snapshot;
        if (cold_snapshot) this.taking_snapshot = true;

        this.snapshots.push(this.sketch.copy());

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
        return new Recording(this.sketch, this.snapshots);
    }
}

class Recording {
    constructor(sketch, snapshots) {
        this.sketch = sketch;
        this.snapshots = snapshots;
    }

    to_html() {
        // Implement this method as needed
    }

    to_mp4(save_to, fps = 2, width = 700, height = null, extra_padding = 50) {
        console.log("Start Video Creation");
    
        const outputPath = path.isAbsolute(save_to) ? save_to : path.join('./renders', save_to);
        
        const timestamp = new Date().toISOString().replace(/:/g, '-');
        const frameDir = `./frames_${timestamp}`;
    
        if (!existsSync(frameDir)) {
            mkdirSync(frameDir);
        }
    
        /*this.snapshots.forEach((snapshot, index) => {
            const pngBuffer = create_png_from_sketch(snapshot, width, height);
            const framePath = `${frameDir}/frame_${String(index).padStart(5, '0')}.png`;
            writeFileSync(framePath, pngBuffer);
        });*/

        this.snapshots.forEach((snapshot, index) => {
            const originalCanvas = create_canvas_from_sketch(snapshot, width, height);
            
            const originalWidth = originalCanvas.width;
            const originalHeight = originalCanvas.height;
            
            const enlargedCanvas = createCanvas(originalWidth + 2 * extra_padding, originalHeight + 2 * extra_padding);
            const ctx = enlargedCanvas.getContext('2d');
            
            ctx.fillStyle = 'white';
            ctx.fillRect(0, 0, enlargedCanvas.width, enlargedCanvas.height);
            ctx.drawImage(originalCanvas, extra_padding, extra_padding);
            
            const enlargedBuffer = enlargedCanvas.toBuffer();
            const framePath = `${frameDir}/frame_${String(index).padStart(5, '0')}.png`;
            writeFileSync(framePath, enlargedBuffer);
        });
        
    
        ffmpeg()
            .addInput(`${frameDir}/frame_%05d.png`)
            .inputFPS(fps)
            .outputOptions([
                '-pix_fmt yuv420p',                 // Pixel format for wide compatibility
                '-c:v libx264',                     // Codec
            ])
            .on('end', () => {
                console.log(`Video saved to ${outputPath}`);
                rmdirSync(frameDir, { recursive: true });
            })
            .on('error', (err) => {
                console.error(`Error occurred: ${err.message}`);
            })
            .save(outputPath);
    }
    
    at_url(url) {
        return this.sketch.dev._serve_html(url, this.to_html());
    }
}
