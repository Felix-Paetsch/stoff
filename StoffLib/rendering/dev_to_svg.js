const { writeFileSync } =  require("fs");
const { sketch_to_renderable } = require("./dev_sketch_to_renderable.js");
const CONF = require("../config.json");

async function create_dev_svg_from_sketch(sketch, width, height, graphics){
    px_per_unit = CONF.DEFAULT_PX_PER_UNIT;

    width  *= px_per_unit;
    height *= px_per_unit;
    
    const {
        bb,
        points,
        lines,
        img_data
    } = await sketch_to_renderable(sketch, graphics, width, height);

    let svgContent = `<svg width="${ bb.width }" height="${ bb.height }" xmlns="http://www.w3.org/2000/svg">`;

    img_data.forEach(img => {
        const base64Image = img.data.toString('base64');
        const imgHref = `data:image/jpeg;base64,${base64Image}`;
        svgContent += `<image href="${imgHref}" x="${img.top_left.x}" y="${img.top_left.y}" width="${img.new_dimensions.x}" height="${img.new_dimensions.y}" opacity="${CONF.DEV_REFERENCE_IMG_OPACITY}" />`;
    });

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

module.exports = { create_dev_svg_from_sketch, save_as_dev_svg }

async function save_as_dev_svg(sketch, save_to, width, height, to_lifesize = false){
    writeFileSync(save_to, await create_dev_svg_from_sketch(sketch, width, height, to_lifesize), (err) => {
        if (err) throw err;
        console.log('SVG file saved!');
    });
}