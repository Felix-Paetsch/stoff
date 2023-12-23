const CONF = require("../config.json");

module.exports = {
    sketch_to_renderable,
    reduce_polyline_sample_points
}

function sketch_to_renderable(sketch, width, height, use_padding = true){
    const sketch_bb = sketch.get_bounding_box();
    
    const padding = use_padding ? CONF.DEFAULT_SAVE_PADDING : 0;
    const usable_width  = width - padding * 2;
    const usable_height = height - padding * 2;

    // Calculate scale factor
    const scaleX = usable_width / sketch_bb.width;
    const scaleY = usable_height / sketch_bb.height;
    const scaleFactor = Math.min(scaleX, scaleY);

    // Calculate the scaled size of the bounding box
    const scaledWidth = sketch_bb.width * scaleFactor;
    const scaledHeight = sketch_bb.height * scaleFactor;

    // Calculate additional translation to center the bounding box
    const offsetX = (usable_width - scaledWidth) / 2 + padding;
    const offsetY = (usable_height - scaledHeight) / 2 + padding;

    // Function to scale and translate a point
    const transformPoint = (point) => {
        return {
            x: (point.x - sketch_bb.top_left.x) * scaleFactor + offsetX,
            y: (point.y - sketch_bb.top_left.y) * scaleFactor + offsetY,
            color: point.color
        };
    };

    return {
        bb: {
            width,
            height
        },
        padding,
        points: sketch.points.map(p => transformPoint(p)),
        lines:  sketch.lines.map(l  => {
            const polyline = l.get_absolute_sample_points();
            const red = reduce_polyline_sample_points(polyline);
            return {
                color: l.color,
                sample_points: red.map(point => transformPoint(point)) // although this rather transforms vectors
            }
        })
    };
}

function reduce_polyline_sample_points(polyline){
    const max_pts_per_line = CONF.RENDER_MAX_SAMPLE_POINTS_PER_LINE;
    if (polyline.length <= max_pts_per_line) return polyline;

    let reduced = [];
    const step = (polyline.length - 1) / (max_pts_per_line - 1);

    for (let i = 0; i < max_pts_per_line; i++) {
        reduced.push(polyline[Math.round(i * step)]);
    }

    return reduced;
}