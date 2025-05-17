class Line extends Spline{
    constructor(){
        // All rendering is relative to base vectors
        super("Line");
        this._is_base_spline = true;
    }

    draw_as_preview(bb){
        return [
            ...this.draw_at(new Vector(bb.x0, bb.y0), new Vector(bb.x1, bb.y1), "preview"),
            svg_elements.circle().$.set_position(bb.x0, bb.y0).set_styles("preview_outer").$,
            svg_elements.circle().$.set_position(bb.x1, bb.y1).set_styles("preview_outer").$
        ]
    }

    draw_at(pos1, pos2, style_name){
        const line = svg_elements.line();
        line.$.set_endpoints(pos1, pos2);
        line.$.set_styles(style_name);

        const res = [line];

        return res;
    }

    get_bb(pos1, pos2){
        const x0 = Math.min(pos1.x, pos2.x);
        const y0 = Math.min(pos1.y, pos2.y);
        const x1 = Math.max(pos1.x, pos2.x);
        const y1 = Math.max(pos1.y, pos2.y);
        
        return {
            x0,
            y0,
            x1,
            y1,
            width:  x1 - x0,
            height: y1 - y0,
            aspect_ratio: (x1 - x0) / (y1 - y0)
        }
    }

    create_usable_spline(){
        spline_list.add(new Line()); // global list of splines
    }
}

Line.prototype.create_usable_spline();