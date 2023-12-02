const { Vector } = require("../Geometry/geometry.js");

function create_svg_from_sketch(s, svgSize = 500){
    const bb = s.get_bounding_box();
    
    const padding = 10;
    const usableSize = svgSize - padding * 2;

    // Calculate scale factor
    const scaleX = usableSize / bb.width;
    const scaleY = usableSize / bb.height;
    const scaleFactor = Math.min(scaleX, scaleY);

    // Calculate the scaled size of the bounding box
    const scaledWidth = bb.width * scaleFactor;
    const scaledHeight = bb.height * scaleFactor;

    // Calculate additional translation to center the bounding box
    const offsetX = (usableSize - scaledWidth) / 2 + padding;
    const offsetY = (usableSize - scaledHeight) / 2 + padding;

    // Initialize SVG content
    let svgContent = `<svg width="${svgSize}" height="${svgSize}" xmlns="http://www.w3.org/2000/svg">`;

    // Function to scale and translate a point
    const transformPoint = (point) => {
        return {
            x: (point.x - bb.top_left.x) * scaleFactor + offsetX,
            y: (point.y - bb.top_left.y) * scaleFactor + offsetY
        };
    };

    const createCircle = (point) => {
        const transformed = transformPoint(point);
        svgContent += `<circle cx="${transformed.x}" cy="${transformed.y}" r="4" stroke="black" fill="white" />`;
    };
      
    const createPolyline = (polyline) => {
        const pointsString = polyline.map(point => {
            const transformed = transformPoint(point);
            return `${transformed.x},${transformed.y}`;
        }).join(' ');
    
        svgContent += `<polyline points="${pointsString}" style="fill:none;stroke:black;stroke-width:1" />`;
    };
    
    s.lines.forEach(l => {
        createPolyline(l.get_absolute_sample_points());
    });
    s.points.forEach(p => createCircle(p));


    svgContent += `</svg>`;

    return svgContent;
}

module.exports = { create_svg_from_sketch }