// TODO: Each Spline handles the rotation themselves

// Anchors -> [<0,0>, <1,0>]
class Spline{
    constructor(name = "", id = null){
        this.points = [];        // [<Vector>]
        this.sub_splines = [];   // [<Subsplines>]
        this.name = name;
        if (id == null){
            id = Math.random();
        }
        this.id = id;
        this._is_base_spline = false;
        this.original_angle = null;
    }

    get_name(){ return this.name; }
    get_id(){  return this.id;    }

    is_base_spline()  { return this._is_base_spline; }
    set_is_base_spline(to){ this._is_base_spline = to; }

    initialize(points, subsplines, angle){
        // [<point>],  [<subspline>]
        this.points      = points;
        this.sub_splines = subsplines;
        this.original_angle = angle;
    }

    custom_initialize(points, anchor_points, subsplines, angle){
        // [<vec>], [index], [{anchor1_index, anchor2_index, spline}]
        this.points = points;
        this.anchor_points = [points[anchor_points[0]], points[anchor_points[1]]];
        this.sub_splines = subsplines.map(s => 
            new Subspline(points[s[0]], points[s[1]], s[2])
        );
        this.original_angle = angle;
    }

    get_bb(pos1 = CONST_RELATIVE_ANCHOR_1, pos2 = CONST_RELATIVE_ANCHOR_2){
        const ret_obj = {
            x0: Infinity,
            y0: Infinity,
            x1: -Infinity,
            y1: -Infinity
        }

        for (const s of this.sub_splines){
            const sub_bb = s.get_bb(pos1, pos2);

            ret_obj.x0 = Math.min(ret_obj.x0, sub_bb.x0);
            ret_obj.y0 = Math.min(ret_obj.y0, sub_bb.y0);
            ret_obj.x1 = Math.max(ret_obj.x1, sub_bb.x1);
            ret_obj.y1 = Math.max(ret_obj.y1, sub_bb.y1);
        }

        const transform_fun = affine_transform_from_normalized_to_anchors(pos1, pos2); 

        for (const p_old of this.points){
            const p_rel = transform_fun(p_old);
            ret_obj.x0 = Math.min(ret_obj.x0, p_rel.x);
            ret_obj.y0 = Math.min(ret_obj.y0, p_rel.y);
            ret_obj.x1 = Math.max(ret_obj.x1, p_rel.x);
            ret_obj.y1 = Math.max(ret_obj.y1, p_rel.y);
        }

        return {
            ...ret_obj,
            width:  ret_obj.x1 - ret_obj.x0,
            height: ret_obj.y1 - ret_obj.y0,
            aspect_ratio: (ret_obj.x1 - ret_obj.x0) / (ret_obj.y1 - ret_obj.y0)
        }
    }
    
    draw_as_preview(bb){
        function create_point(vec, type){
            const circle = svg_elements.circle(type);
            circle.$.set_pos(vec);

            return circle;
        }

        // Make rotated
        const r_fun = rotation_fun(CONST_RELATIVE_ANCHOR_1, this.original_angle - const_relative_anchor_angle());
        const rotated_relative_anchors = [r_fun(CONST_RELATIVE_ANCHOR_1), r_fun(CONST_RELATIVE_ANCHOR_2)];

        // Scale to be bigger than bb
        const size_bb = this.get_bb(
            ...rotated_relative_anchors
        );

        const upscaled_relative_anchors = rotated_relative_anchors.map(v => v.mult(
            Math.max(
                bb.width/Math.max(size_bb.width, .1), bb.height/Math.max(size_bb.height, .1)
            )
        ));

        // Make sure X doesnt overflow
        const sizeX_bb = this.get_bb(
            ...upscaled_relative_anchors
        );

        let scaled_relative_anchorsX = upscaled_relative_anchors;
        if (sizeX_bb.width > bb.width){
            scaled_relative_anchorsX = scaled_relative_anchorsX.map(x => x.mult(bb.width/sizeX_bb.width))
        }

        // Make sure Y doesnt overflow
        const sizeY_bb = this.get_bb(
            ...scaled_relative_anchorsX
        );

        let scaled_relative_anchorsY = scaled_relative_anchorsX;
        if (sizeY_bb.height > bb.height){
            scaled_relative_anchorsY = scaled_relative_anchorsY.map(x => x.mult(bb.height/sizeY_bb.height))
        }

        const pre_translated_bb = this.get_bb(
            ...scaled_relative_anchorsY
        );

        // Transform, so the padding is respected
        const t = scaled_relative_anchorsY;
        const final_anchors = [
            new Vector(t[0].x + bb.x0 - pre_translated_bb.x0, t[0].y + bb.y0 - pre_translated_bb.y0),
            new Vector(t[1].x + bb.x0 - pre_translated_bb.x0, t[1].y + bb.y0 - pre_translated_bb.y0)
        ];

        const error_bound = .1;
        assert(Math.abs(vec_angle_clockwise(...final_anchors) - this.original_angle) < error_bound, "Angle is preserved!");
        assert(bb.width - this.get_bb(...final_anchors).width > -1 * error_bound, "Max width correct!");
        assert(bb.height - this.get_bb(...final_anchors).height > -1 * error_bound, "Max height correct!");
        assert(Math.abs(bb.x0 - this.get_bb(...final_anchors).x0) < error_bound, "Left aligns!");
        assert(Math.abs(bb.y0 - this.get_bb(...final_anchors).y0) < error_bound, "Top aligns!");
        assert(
            (Math.abs(bb.height - this.get_bb(...final_anchors).height) < error_bound)
            || (Math.abs(bb.width - this.get_bb(...final_anchors).width) < error_bound)
        , "Scaled to maximum size!");

        const affine_transform = affine_transform_from_normalized_to_anchors(...final_anchors);

        const res = this.draw_at(
            affine_transform(CONST_RELATIVE_ANCHOR_1), 
            affine_transform(CONST_RELATIVE_ANCHOR_2), "preview"
        );

        res.push(
            create_point(affine_transform(CONST_RELATIVE_ANCHOR_1), "preview_outer"), 
            create_point(affine_transform(CONST_RELATIVE_ANCHOR_2), "preview_outer")
        );

        for (const point of this.points){
            res.push(create_point(affine_transform(point), "preview_inner"))
        }
        
        return res;
    }

    draw_at(vec1, vec2, style_name){
        const return_elements = [];

        const affine_transform = affine_transform_from_normalized_to_anchors(vec1, vec2);
        
        for (let i = 0; i < this.sub_splines.length; i++){
            const anchor_transformed = this.sub_splines[i].anchors.map(a => affine_transform(a));
            return_elements.push(...this.sub_splines[i].spline.draw_at(...anchor_transformed, style_name))
        }

        return return_elements;
    }
}