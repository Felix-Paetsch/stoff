const { writeFileSync } =  require("fs");
const { sketch_to_renderable, calculate_correct_width_height } = require("./sketch_to_renderable.js");
const { interpolate_colors } = require("../colors.js");

function create_svg_from_sketch(s, width = null, height = null){
    const correct_dimensions = calculate_correct_width_height(s, width, height);  
    const {
        bb,
        points,
        lines
    } = sketch_to_renderable(s, correct_dimensions.width, correct_dimensions.height);

    let svgContent = `<svg width="${ bb.width }" height="${ bb.height }" xmlns="http://www.w3.org/2000/svg">`;

    const createCircle = (point) => { 
        const fill = interpolate_colors(point.color, point.color) == "rgb(0,0,0)"
            ? "white" : point.color;
        const stroke = "black";
        svgContent += `<circle cx="${ point.x }" cy="${ point.y }" r="4" stroke="${ stroke }" fill="${ fill }" />`;
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

function save_as_svg(sketch, save_to, width, height){
    writeFileSync(save_to, create_svg_from_sketch(sketch, width, height), (err) => {
        if (err) throw err;
        console.log('SVG file saved!');
    });
}