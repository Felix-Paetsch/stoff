const { Vector } = require("../Geometry/geometry.js");

function create_svg_from_sketch(s, svgSize = 500){
    const bb = s.get_bounding_box();
    
    const max_pts_per_line = 200;
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
            y: (point.y - bb.top_left.y) * scaleFactor + offsetY,
            color: point.color
        };
    };

    const createCircle = (point) => {
        const transformed = transformPoint(point);
        svgContent += `<circle cx="${ transformed.x }" cy="${ transformed.y }" r="4" stroke="${ transformed.color }" fill="white" />`;
    };
      
    const createPolyline = (polyline, color = "black") => {
        const pointsString = polyline.map(point => {
            const transformed = transformPoint(point);
            return `${transformed.x},${transformed.y}`;
        }).join(' ');
    
        svgContent += `<polyline points="${ pointsString }" style="fill:none;stroke:${ color };stroke-width:1" />`;
    };
    
    s.lines.forEach(l => {
        const polyline = l.get_absolute_sample_points();
        const red = reduce_polyline_sample_points(polyline, max_pts_per_line);
        createPolyline(red, l.color);
    });
    s.points.forEach(p => createCircle(p));


    svgContent += `</svg>`;

    return svgContent;
}

module.exports = { create_svg_from_sketch }

function reduce_polyline_sample_points(polyline, max_pts_per_line){
    if (polyline.length <= max_pts_per_line) return polyline;

    let reduced = [];
    const step = (polyline.length - 1) / (max_pts_per_line - 1);

    for (let i = 0; i < max_pts_per_line; i++) {
        reduced.push(polyline[Math.round(i * step)]);
    }

    return reduced;
}