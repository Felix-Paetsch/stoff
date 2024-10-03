import { create_canvas_from_sketch } from '../../sketch_methods/rendering_methods/to_png_jpg.js';
import { writeFileSync, existsSync, mkdirSync, rmSync, readdirSync, statSync } from 'fs';
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
    
    at_url(url) {
        return this.sketch.dev._serve_html(url, this.to_html());
    }
}
