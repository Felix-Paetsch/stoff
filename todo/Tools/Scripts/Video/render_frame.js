export default function render_frame(sketch, data, fp){
    const width = 1920;
    sketch.save_as_png(fp, width, width*9/16);
}