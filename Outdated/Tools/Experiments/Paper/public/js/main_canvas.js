// Separate adding point/spline from UI, so highlight point, add point

class Main_Canvas{
    constructor(){
        this.svg = new SVG("#main_svg");

        this.points =      [];   // [<Points>]
        this.sub_splines = [];   // [<Subsplines>]

        this.anchors = [null, null]; // [<Points>]
        this.selected_points = [null, null];
        this.selected_subspline = null;

        this.current_ui_state = {
            "dragging_state": false,
            "state": "default"
        };

        this.mouse = {
            pressed: false,
            over: false,
            x: 0,
            y: 0
        }

        this.initialize();
    }

    initialize(){
        this.svg.addEventListener("click", ((e) => {
            this.mouse.pressed = true;
            this.canvas_clicked(e);
        }).bind(this));

        this.svg.addEventListener("mousemove", ((e) => {
            this.mouse.over = true;
            this.mouse.x = e.clientX;
            this.mouse.y = e.clientY;

            if (this.mouse.pressed){
                this.mouse_dragged(e);
            }
        }).bind(this));

        this.svg.addEventListener("mouseleave", ((e) => {
            this.mouse.over = false;
            this.mouse.pressed = false;
            this.current_ui_state.dragging_point = false;
        }));

        this.svg.addEventListener('mouseup', ((e) => {
            this.mouse.pressed = false;
        }).bind(this));

        this.add_keydown("a", this.add_point);
        this.add_keydown("s", this.make_spline);
        this.add_keydown("l", () => {
            if (this.selected_points[0] && this.selected_points[1]){
                this.insert_or_replace_spline();
            }
        });
        this.add_keydown("r", () => {
            // New Anchor
            const a = this.selected_points[1];
            if (a){
                if (this.anchors.indexOf(a) > -1){
                    return;
                }
                
                // This expects anchor point does exist, 
                // but this should be garanteaed since up to 2 points every point is anchor
                this.anchors.shift().set_styles("no_anchor");
                this.anchors.push(a);
                a.set_styles("anchor");
            }
        });
        this.add_keydown("x", () => {
            if (this.selected_subspline){
                return this.remove_subspline(this.selected_subspline);
            }

            const a = this.selected_points[1];
            if (a) {
                this.remove_point(a);
            }
        });
    }

    insert_or_replace_spline(){
        if (this.selected_points.length < 2) return;

        if (this.selected_subspline == null){
            return this.add_subspline([
                this.selected_points[0], 
                this.selected_points[1]
            ], spline_list.get_by_name("Line"));
        } else {
            const old_s = this.selected_subspline;

            this.remove_subspline(this.selected_subspline);

            const possible_splines = spline_list.iterate();
            let i = 0;
            while (i < possible_splines.length){
                if (
                    possible_splines[i].spline.get_id() == old_s.spline.get_id()
                ){
                    break;
                }
                i += 1;
            }

            if (i == possible_splines.length - 1){
                return this.selected_subspline = null;
            } else if (i == possible_splines.length){
                i = -1;
            }

            return this.add_subspline([
                this.selected_points[0], 
                this.selected_points[1]
            ], possible_splines[i + 1].spline);
        }
    }

    remove_subspline(s){
        for (let i = 0; i < this.sub_splines.length; i++){
            if (s == this.sub_splines[i]){
                this.sub_splines[i].spline.remove_from_dom();
                this.sub_splines.splice(i, 1);
                break;
            }
        }
        this.selected_subspline = null;
    }

    remove_point(p){
        this.set_current_spline(null);
        if (!p){ return; }

        p.remove_from_dom();
        
        // Remove from points
        const point_index = this.points.indexOf(p);
        this.points.splice(point_index, 1);

        // Remove from last_active_pts
        if (p == this.selected_points[1]){
            this.selected_points.pop();
            this.selected_points.unshift(null);   
            if (this.selected_points[1]){
                this.selected_points[1].set_styles("main_canvas_selected_latest");
            }
        } else {
            this.selected_points[0] = null;
        }
        
        // Remove from anchors
        const anchor_index = this.anchors.indexOf(p);
        if (anchor_index > -1){
            this.anchors.splice(anchor_index, 1);
            const new_anchor = this.points.filter(x => x !== this.anchors[0])[0];
            if (typeof new_anchor !== "undefined"){
                this.anchors.push(new_anchor);
                new_anchor.set_styles("anchor");
            } else {
                this.anchors.unshift(null);
            }
        }

        // Remove lines
        for (let i = this.sub_splines.length - 1; i > - 1; i--){
            if (this.sub_splines[i].anchors.includes(p)){
                this.sub_splines[i].spline.remove_from_dom();
                this.sub_splines.splice(i, 1);
            }
        }
    }

    shift_selected_points(p){
        if (p == this.selected_points[1]){
            return;
        }

        this.current_ui_state.state = "single_point_selected";
        const s = this.selected_points.shift();
        if (s){
            s.set_styles("main_canvas_default");
        }

        if (this.selected_points[0]){
            this.current_ui_state.state = "two_points_selected";
            this.selected_points[0].set_styles("main_canvas_selected_2");
        }

        p.set_styles("main_canvas_selected_latest");
        this.selected_points.push(p);
    }

    add_subspline(anchors, spline){
        const sub_spline = new Renderable_Subspline(anchors, spline, this);
        sub_spline.set_styles("main_canvas_default");

        this.sub_splines.push({
            spline: sub_spline,
            anchors: anchors
        });

        sub_spline.set_elements_attribute("_subspline_arr_element", this.sub_splines[this.sub_splines.length - 1]);
        this.set_current_spline(this.sub_splines[this.sub_splines.length - 1]);
    }

    add_point(){
        this.set_current_spline(null);
        const p = new Point(new Vector(this.mouse.x, this.mouse.y), this);
        this.points.push(p);
        this.shift_selected_points(p);

        if (!this.anchors[0]){
            this.anchors.shift();
            this.anchors.push(p);
            p.set_styles("anchor");
        } else {
            p.set_styles("no_anchor");
        }
    }

    mouse_dragged(e){
        if (!this.selected_points[1] || !this.current_ui_state.dragging_point){
            return;
        }

        this.selected_points[1].set_position(e.clientX, e.clientY);

        this.rerender_subsplines(this.selected_points[1]);
    }

    rerender_subsplines(adjacent_points){
        if (!Array.isArray(adjacent_points)){
            adjacent_points = [adjacent_points];
        }

        for (const s of this.sub_splines){
            if (s.anchors.some(a => adjacent_points.includes(a))){
                s.spline.set_styles("main_canvas_default");
            }
        }
    }

    canvas_clicked(e){
        // Refactor into 3 parts (?)
        const t = e.target;

        const most_recent_active_pt = this.selected_points[1]; 
        if (!most_recent_active_pt){
            if (["circle"].includes(e.target.tagName)){
                const point_element = t._point_el;
                this.shift_selected_points(point_element);
            }
            return;
        }
        
        if (t == most_recent_active_pt.el){
            this.current_ui_state.dragging_point = !this.current_ui_state.dragging_point;
            this.set_current_spline(null);
        } else if (["circle"].includes(e.target.tagName)){
            const point_element = t._point_el;
            this.shift_selected_points(point_element);
            this.set_current_spline(null);
        } else if (["line"].includes(e.target.getAttribute("_svg_ident"))){
            this.set_current_spline(e.target._subspline_arr_element);
        } else {
            this.selected_points[1].set_position(e.clientX, e.clientY);
            this.rerender_subsplines(this.selected_points[1]);
            this.set_current_spline(null);
        }
    }

    set_current_spline(t = null){
        if (this.selected_subspline){
            this.selected_subspline.spline.set_styles("main_canvas_default");
            this.selected_subspline = null;

            this.selected_points[1].set_styles("main_canvas_selected_latest");
            this.selected_points[0].set_styles("main_canvas_selected_2");
        }
        if (t == null) { return; };
        
        this.current_ui_state.dragging_point = false;

        this.selected_subspline = t;
        this.selected_subspline.spline.set_styles("main_canvas_selected");
        this.selected_points.forEach(p => p.set_styles("adjacent_new_spline_insert"));
    }

    add_keydown(key, func, guard_mouseover = true){
        event_handler.subscribe(`key_up::${ key.toLowerCase() }`, ((_) => {
            if (!guard_mouseover || this.mouse.over){
                func.bind(this)();
            }
        }).bind(this));
    }

    make_spline(){
        const new_s = new Spline(
            "hoy"
        );

        const affine_transform = affine_transform_from_anchors_to_normalized(this.anchors[0].vec, this.anchors[1].vec);
        
        new_s.initialize(
            this.points.map(p => affine_transform(p.vec)),
            this.sub_splines.map(s => new Relative_Subspline(s.anchors.map(a => affine_transform(a.vec)), s.spline.spline)),
            vec_angle_clockwise(this.anchors[0].vec, this.anchors[1].vec)
        );
        
        spline_list.add(new_s);
    }
}