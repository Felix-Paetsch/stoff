import fs from "fs";
import path from "path";

import CONF from './config.json' assert { type: 'json' };

import design from "../Patterns/export_pattern_dev.js";
import generate_setting from './generate_setting.js';
import render_frame from './render_frame.js';
import merge_video from './merge_video.js';

const {
    design_config, 
    create_design
} = design;

const framesDir = "renders/video/frames";
if (fs.existsSync(framesDir)) {
    fs.readdirSync(framesDir).forEach((file) => {
        const filePath = path.join(framesDir, file);
        fs.unlinkSync(filePath);
    });
} else {
    fs.mkdirSync(framesDir(framesDir));
}


const new_setting = generate_setting(design_config);
const frames = Math.ceil(CONF.fps * CONF.duration);

for (let i = 0; i < frames; i++) {
    const setting = new_setting();
    const sketch = create_design(setting);
    render_frame(sketch, setting, `renders/video/frames/frame_${i}.png`);
}

merge_video(framesDir, "renders/video/output/out.mp4");