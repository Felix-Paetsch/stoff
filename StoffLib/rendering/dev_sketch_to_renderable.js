const fs = require('fs');
const path = require('path');
const axios = require('axios');
const sizeOf = require('image-size');
const { Vector } = require("../../Geometry/geometry");
const CONF = require("../config.json");

const { reduce_polyline_sample_points } = require("./sketch_to_renderable.js");

module.exports = async (sketch, graphics, width, height, use_padding = true) => {
    const sketch_bb = sketch.get_bounding_box();
    const img_data  = await get_image_data(graphics);
    
    update_bb_from_img_data(sketch_bb, img_data); // Mutates sketch_bb

    const max_pts_per_line = 100;
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
            const red = reduce_polyline_sample_points(polyline, max_pts_per_line);
            return {
                color: l.color,
                sample_points: red.map(point => transformPoint(point)) // although this rather transforms vectors
            }
        }),
        img_data: img_data.map(d => {
            let top_left = transformPoint(d.top_left);
            top_left = new Vector(top_left.x, top_left.y);
            let bottom_right = transformPoint(d.bottom_right);
            bottom_right = new Vector(bottom_right.x, bottom_right.y);

            return {
                ...d,
                top_left,
                bottom_right,
                new_dimensions: bottom_right.subtract(top_left)
            }
        })
    };
}

function update_bb_from_img_data(bb, img_data){
    let min_x = bb.top_left.x;
    let min_y = bb.top_left.y;
    let max_x = bb.bottom_right.x;
    let max_y = bb.bottom_right.y;

    for (let d of img_data){
        min_x = Math.min(min_x, d.top_left.x);
        min_y = Math.min(min_y, d.top_left.y);
        max_x = Math.max(max_x, d.bottom_right.x);
        max_y = Math.max(max_y, d.bottom_right.y);
    }

    bb.width  = max_x - min_x;
    bb.height = max_y - min_y;
    bb.top_left     = new Vector(min_x, min_y);
    bb.top_right    = new Vector(max_x, min_y);
    bb.bottom_left  = new Vector(min_x, max_y);
    bb.bottom_right = new Vector(max_x, max_y);
}

async function get_image_data(graphics) {
    const results = [];

    for (const graphic of graphics) {
        const graphicPath = graphic[0];
        let fullPath;
        let data;

        if (graphicPath.startsWith('http://') || graphicPath.startsWith('https://')) {
            // Handle URL
            const response = await axios.get(graphicPath, { responseType: 'arraybuffer' });
            data = Buffer.from(response.data, 'binary');
        } else {
            // Handle file path
            fullPath = path.isAbsolute(graphicPath) ? graphicPath : path.join(__dirname, '../../', graphicPath);
            data = fs.readFileSync(fullPath);
        }

        const dimensions = sizeOf(data);
        const r = { 
            path: graphicPath, 
            data,
            original_dimensions: new Vector(dimensions.width, dimensions.height),
            top_left: new Vector(graphic[1], graphic[2])
        };

        if (graphic.length == 4){ // FP, top_left_x, top_left_y, scale
            r.bottom_right = r.top_left.add(r.original_dimensions.scale(graphic[3]));
        } else { 
            // FP, top_left_x, top_left_y, width, height
            // If one is null, then assume scale by aspect ratio
            if (graphic[3] === null){
                r.bottom_right = r.top_left.add(r.original_dimensions.scale(
                    graphic[4]/r.original_dimensions.y
                ));
            } else if (graphic[4] === null){
                r.bottom_right = r.top_left.add(r.original_dimensions.scale(
                    graphic[3]/r.original_dimensions.x
                ));
            } else {
                r.bottom_right = r.top_left.add(new Vector(graphic[3], graphic[4]));
            }
        }

        r.new_dimensions = r.bottom_right.subtract(r.top_left);

        results.push(r);
    }

    return results;
}