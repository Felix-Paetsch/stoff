const { writeFileSync } =  require("fs");
const sketch_to_renderable = require("./sketch_to_lines_and_points.js");

let PX_PER_CM = 10; // Set the desired pixels per centimeter

function create_svg_from_sketch(s, width, height, to_lifesize = false){
    if (!to_lifesize && width !== true){
        PX_PER_CM = 1
    }

    if (typeof width == "undefined" || typeof height == "undefined"){
        const { width: bb_width, height: bb_height } = s.get_bounding_box(); 
        const padding = 10 * PX_PER_CM; // Padding in pixels
        width  = bb_width  * PX_PER_CM + 2 * padding;
        height = bb_height * PX_PER_CM + 2 * padding;
    } else {
        width *= PX_PER_CM;
        height *= PX_PER_CM;
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