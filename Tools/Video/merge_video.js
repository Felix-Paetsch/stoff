import ffmpeg from 'fluent-ffmpeg';
import CONF from './config.json' assert { type: 'json' };

ffmpeg.setFfmpegPath('C:\\Program Files\\ffmpeg\\ffmpeg.exe'); // Update this path to the actual path of your ffmpeg.exe

export default (inputFolder = "renders/video/frames", outputVideo = "renders/output/out.mp4") => {
    console.log(`${inputFolder}/frame_%d.png`);
    ffmpeg()
        .addInput(`${inputFolder}/frame_%d.png`)
        .inputFPS(CONF.fps)
        .videoCodec('libx264')  // Use H.264 codec
        .outputOptions('-pix_fmt yuv420p')  // Ensure compatibility
        .output(outputVideo)
        .outputFPS(CONF.fps)
        .on('start', (commandLine) => {
            console.log(`FFmpeg command: ${commandLine}`);
        })
        .on('progress', (progress) => {
            console.log(`Processing: ${progress.frames} frames`);
        })
        .on('end', () => {
            console.log('Video created successfully!');
        })
        .on('error', (err) => {
            console.error('Error creating video:', err);
        })
        .run();
};
