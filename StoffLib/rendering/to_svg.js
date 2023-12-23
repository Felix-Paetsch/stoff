const { writeFileSync } =  require("fs");
const sketch_to_renderable = require("./sketch_to_renderable.js");
const CONF = require("../config.json");

let px_per_unit = CONF.PX_PER_CENTIMETER;

function create_svg_from_sketch(s, width, height, to_lifesize = false){
    if (!to_lifesize && width !== true){
        px_per_unit = CONF.DEFAULT_PX_PER_UNIT;
    }

    if (typeof width == "undefined" || typeof height == "undefined"){
        const { width: bb_width, height: bb_height } = sketch.get_bounding_box(); 
        const padding = 10 * px_per_unit; // Padding in pixels
        width  = bb_width  * px_per_unit + 2 * padding;
        height = bb_height * px_per_unit + 2 * padding;
    } else {
        width  *= px_per_unit;
        height *= px_per_unit;
    }
    
    const {
        bb,
        points,
        lines
    } = sketch_to_renderable(s, width, height);

    let svgContent = `<svg width="${ bb.width }" height="${ bb.height }" xmlns="http://www.w3.org/2000/svg">`;

    const createCircle = (point) => {
        svgContent += `<circle cx="${ point.x }" cy="${ point.y }" r="4" stroke="${ point.color }" fill="white" />`;
    };
      
    const createPolyline = (polyline) => {
        const pointsString = polyline.sample_points.map(point => `${point.x},${point.y}`).join(' ');
    
        svgContent += `<polyline points="${ pointsString }" style="fill:none;stroke:${ polyline.color };stroke-width:1" />`;
    };
    
    lines.forEach(createPolyline);
    points.forEach(createCircle);

    svgContent += `</svg>`;

    return svgContent;
}

module.exports = { create_svg_from_sketch, save_as_svg }

function save_as_svg(sketch, save_to, width, height, to_lifesize = false){
    writeFileSync(save_to, create_svg_from_sketch(sketch, width, height, to_lifesize), (err) => {
        if (err) throw err;
        console.log('SVG file saved!');
    });
}