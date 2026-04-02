class Img{
    constructor(img_data, possible_keypoints, possible_joints){
        this.id = img_data.id;
        this.img_data = img_data;
        this.canvas = get_all_elements_of_path_with_property("._hu_annotation_img_wrapper", "_id", this.id)[0]
                            .querySelector("._hu_point_container");
        this.img_obj = this.canvas.previousElementSibling;

        try { // Annotated points of img
            this.points = img_data.points; // JSON.parse(img_data.points);
            this.points.forEach(p => {
                if (typeof p.state == "undefined"){
                    p.state = "unannotated";
                }
            })
        } catch {
            console.log("Could not restore points for img", img_data);
            this.points = [];
        }

        if (typeof img_data.should_be_used !== "boolean"){
            this.img_data.should_be_used = true;
        }

        this.automatically_activate_next_pt = true;
        this.mouse_over_img = false;
        this.current_img_modifier = {
            "zoom": 1,
            "x_offset": 0,
            "y_offset": 0
        };

        this.max_zoom =  5;
        this.min_zoom = 0.8

        this.current_interaction_mode = "annotate";     // annotate || drag
        this.currently_dragging_img = false;
        this.dragging_start_pos     = {
            start_x_offset: 0,
            start_y_offset: 0,
            start_cursor_x: 0,
            start_cursor_y: 0
        };

        this.cursor_position = {};

        // vvv These are constant (for each image the same), 
        // vvv since there aren't many and they are immutable, dublication seems fine
        this.possible_keypoints = possible_keypoints;
        this.possible_joints    = possible_joints;
        this.undo_redo = new UndoRedo();
        this.keypoints_currently_hidden = false;

        event_handler.after_dom_loaded(this.initialize_self.bind(this));
    }

    should_be_used(){ return this.img_data.should_be_used; }
    toggle_skip_img(force_to){
        if (typeof force_to !== "boolean"){
            force_to = !this.img_data.should_be_used;
        }
        this.img_data.should_be_used = force_to;
        upload_data_to_server();
        return this.img_data.should_be_used; 
    }
    is_annotated(){
        return this.possible_keypoints.map(p => p.id).every(id => this.point_is_annotated(id)) || !this.should_be_used();

        // return (this.points.length > 0 && this.points.some(p => ["visible", "hidden"].includes(p.state)))
        //    || !this.should_be_used();
    }
    is_partially_annotated(){
        return this.possible_keypoints.map(p => p.id).some(id => this.point_is_annotated(id)) || !this.should_be_used();

        // return (this.points.length > 0 && this.points.some(p => ["visible", "hidden"].includes(p.state)))
        //    || !this.should_be_used();
    }

    point_is_annotated(point_id){
        return this.points.some(p => p.point_id == point_id && ["visible", "hidden", "skipped"].includes(p.state));
    }

    to_img_data(){
        assert_not_editing();

        return {
            ...this.img_data,
            is_annotated: this.is_annotated(),
            point_data: JSON.stringify(this.points)
        }
    }

    get_point_from_id(point_id){
        let point = this.points.filter(x => x.point_id == point_id)[0];
        if (point){ return point; }
        
        return {
            point_id: point_id,
            // is_hidden: false,
            // is_annotated: false,
            state: "unannotated"
        }
    }

    get_key_point_from_id(point_id){
        return this.possible_keypoints.filter(p => p.id == point_id)[0]
    }

    iter_points(){
        function get_point_for_img_from_id(point_id){
            for (let i = this.points.length - 1; i >= 0; i--) {
                const point = this.points[i];
                if (point.point_id === point_id) {
                    return point;
                }
            }
        
            return {
                point_id,
                state: "unannotated"
            }
        }

        const allPoints = this.possible_keypoints;
        const pointsForImage = [];

        for (let i = 0; i < allPoints.length; i++) {
            const point = allPoints[i];
            const pointForImage = get_point_for_img_from_id.bind(this)(point.id);
            pointsForImage.push(pointForImage);
        }
    
        return pointsForImage;
    }

    get_id(){ return this.id; }
    
    render_points(){
        if (this.possible_keypoints.length == 0){
            return;
        }
        
        this.possible_keypoints.forEach(p => p.img_point.render());
        const current_keypoint = this.get_key_point_from_id(keypoint_toolbar.get_active_point().id);
        current_keypoint.img_point.render_as_current(false);
        this.possible_joints.forEach(j => j.img_joint.render());
    }

    reset(save_change = true){
        if (
            !is_editing_mode()
        ) return;
        
        this.possible_keypoints.forEach(p => p.img_point.reset());
        this.points = [];
        keypoint_toolbar.set_first_point_active();
        
        this.set_zoom(1);
        this.save_change(save_change);
    }

    nudge_current_point(direction){
        this.set_point_data(
            keypoint_toolbar.get_active_point().id,
            (old_point) => {
                if (["unannotated", "skipped"].includes(old_point.state)){
                    return;
                }
                
                let {
                    widthPercent, heightPercent
                } = old_point;

                if (direction == "up"){
                    heightPercent -= .5 / this.current_img_modifier.zoom;
                }
                if (direction == "down"){
                    heightPercent += .5 / this.current_img_modifier.zoom;
                }
                if (direction == "left"){
                    widthPercent -= .5 / this.current_img_modifier.zoom;
                }
                if (direction == "right"){
                    widthPercent += .5 / this.current_img_modifier.zoom;
                }

                widthPercent = Math.min(100, Math.max(widthPercent, 0));
                heightPercent = Math.min(100, Math.max(heightPercent, 0));

                return {
                    ...old_point,
                    widthPercent, heightPercent
                }
            }
        );
        
        this.save_change();
    }

    user_set_point(e, stop_activating_next_pt = false, save_change = true) {
        if (
            !is_editing_mode() 
         || !(this.current_interaction_mode == "annotate")
         || this.possible_keypoints.length == 0
        ) return;

        const point_id = keypoint_toolbar.get_active_point().id; 
        const point_position = this.get_canvas_point_position_of_event(e);

        this.set_point_data(point_id, (old_point) => {
            if (["unannotated", "skipped"].includes(old_point.state)){
                old_point.state = "visible"
            }
            return {
                ...old_point, 
                ...point_position
            }
        }, save_change);

        if ((this.automatically_activate_next_pt || keypoint_toolbar.no_sticky_points) && !stop_activating_next_pt){
            keypoint_toolbar.activate_following_pt(false);
        }
    }

    initialize_self(){
        this.canvas.addEventListener("mousemove", ((e) => {
            if (e.target == this.canvas){
                this.mouse_over_img = true;
                keypoint_toolbar.image_mouse_event("mousemove", e);
                this.image_mouse_event("mousemove", e);
                this.cursor_position = e;
                return;
            }
            this.mouse_over_img = false;
        }).bind(this));

        this.canvas.addEventListener("mouseleave", ((e) => {
            this.image_mouse_event("mouseleave", e);
        }).bind(this));

        this.canvas.addEventListener('mousedown', ((e) => {
            // Handle right-click (mousedown) event
            if (e.button === 0) {
                keypoint_toolbar.image_mouse_event("right_click_down", e);
                this.image_mouse_event("right_click_down", e);
            }
        }).bind(this));
        document.addEventListener('keydown', ((e) => {
            if (e.key === 'j' && this.mouse_over_img == true) {
                keypoint_toolbar.image_mouse_event("right_click_down", this.cursor_position);
                this.image_mouse_event("right_click_down", this.cursor_position);
            }
        }).bind(this));
        

        this.canvas.addEventListener('mouseup', ((e) => {
            // Handle right-click (mouseup) event
            if (e.button === 0) {
                keypoint_toolbar.image_mouse_event("right_click_up", e);
                this.image_mouse_event("right_click_up", e);
            }
        }).bind(this));
        document.addEventListener('keyup', ((e) => {
            if (e.key === 'j' && this.mouse_over_img == true) {
                keypoint_toolbar.image_mouse_event("right_click_up", this.cursor_position);
                this.image_mouse_event("right_click_up", this.cursor_position);
            }
        }).bind(this));

        this.possible_keypoints.forEach(p => { p.img_point = new ImgPoint(p, this); });
        this.possible_joints.forEach(j =>    { j.img_joint = new ImgJoint(j, this); });

        this.undo_redo.init(this.set_annotation_as_is_fun());
    }

    set_point_data(point_id, point_update_fun, save_change = true){
        assert_not_editing();
        
        let old_point_annotation = this.points.filter(x => x.point_id == point_id);
        if (!old_point_annotation){
            old_point_annotation = {
                point_id: point_id,
                is_hidden: false,
                is_annotated: true
            }
        }

        const points_with_that_id = [];
            
        for (let i = this.points.length - 1; i >= 0; i--) {
            const point = this.points[i];
            if (point.point_id === point_id) {
                points_with_that_id.push(point);
                this.points.splice(i, 1);
            }
        }
    
        const old_point = points_with_that_id.length === 0 ? 
                    { point_id, state: "unannotated" } : points_with_that_id[0]
    
        const new_point = point_update_fun(old_point);

        this.possible_keypoints.filter(p => p.id == point_id)[0].img_point.set_current_img_point(new_point);
        this.points.push(new_point);

        this.save_change(save_change);
    }

    remove_point(point_id){
        this.possible_keypoints.forEach(p => {
            if (p.id == point_id) {
                p.img_point.reset()
            }
        });
        this.points = this.points.filter(p => p.point_id != point_id);

        this.save_change();
    }

    toggle_hide_point(point_id){
        if (
            !is_editing_mode()
            // || !this.point_is_annotated(point_id)
        ) return;

        this.set_point_data(point_id, (old_point) => {
            let newState;
    
            if (!old_point || old_point.state !== "hidden") {
                newState = "hidden";
            } else if (
                typeof old_point.widthPercent === "number" &&
                typeof old_point.heightPercent === "number"
            ) {
                newState = "visible";
            } else {
                newState = "unannotated";
            }
            
            return { ...old_point, state: newState };
        });
    }

    toggle_skip_point(point_id){
        if (
            !is_editing_mode()
        ) return;
        
        this.set_point_data(point_id, (old_point) => {
            let newState;
    
            if (!old_point || old_point.state !== "skipped") {
                newState = "skipped";
            } else {
                newState = "visible";
                if (
                    typeof old_point.widthPercent !== "number" ||
                    typeof old_point.heightPercent !== "number"
                ){
                    old_point.widthPercent  = 50;
                    old_point.heightPercent = 50;
                }
            }

            return { ...old_point, state: newState };
        });

        if (this.get_point_from_id(point_id).state == "skipped"){
            keypoint_toolbar.activate_following_pt(false);
        }
    }

    get_canvas_point_position_of_event(e){
        function isNormalFloat(n) {
            return Number.isFinite(n) && !Number.isNaN(n) && Number(n) === n;
        }
    
        // Get the image element
        const img = e.target.previousElementSibling;
    
        // Get the position of the click relative to the image's top-left corner
        const x = e.offsetX || e.layerX;
        const y = e.offsetY || e.layerY;
    
        // Calculate the percentage of the width and height where the click happened
        const widthPercent = (x / img.width) * 100;
        const heightPercent = (y / img.height) * 100;
        // console.log(`Point positioned at: ${widthPercent}% width, ${heightPercent}% height`);
    
        if (!isNormalFloat(widthPercent) || !isNormalFloat(heightPercent)){
            throw new Error("Width or height of point are undefined!")
        }
        return {widthPercent, heightPercent};
    }

    render(){
        this.render_points();
        keypoint_toolbar.render_toolbar();
        frame_toolbar.render_frame_toolbar_UI(this.get_id());
    }

    activate(){
        this.automatically_activate_next_pt = true;
        this.set_interaction_mode("annotate");
        this.unhide_keypoints();

        keypoint_toolbar.set_active_img(this);
        frame_toolbar.render_frame_toolbar_UI(this.id);
        
        // Scroll Frame into view in toolbar
        const img_frame_toolbar_div = get_all_elements_of_path_with_property("._hu_frame_element", "_id", "" + this.id)[0];
        img_frame_toolbar_div.scrollIntoView({ block: 'nearest' });

        this.render_points();
        this.undo_redo.update_UI();
    }

    toggle_hide_keypoints(strict = false){
        if (this.keypoints_currently_hidden){
            return this.unhide_keypoints();
        }

        this.hide_keypoints(strict);
    }

    hide_keypoints(strict = false){
        // strict: Hide all including current one
        this.keypoints_currently_hidden = true;
        this.canvas.classList.add("hide_all_keypoints");
        if (!strict) this.canvas.classList.add("hide_all_but_current_keypoints");
    }

    unhide_keypoints(){
        this.keypoints_currently_hidden = false;
        this.canvas.classList.remove("hide_all_keypoints");
        this.canvas.classList.remove("hide_all_but_current_keypoints");
    }

    scale_up(e = {}){
        if (e.key_event){
            if (!this.mouse_over_img) return;
        }

        this.current_img_modifier.zoom *= 1.1;
        if (this.current_img_modifier.zoom > this.max_zoom){
            this.current_img_modifier.zoom = this.max_zoom;
        }

        this.transform();
    }

    scale_down(e = {}){
        if (e.key_event){
            if (!this.mouse_over_img) return;
        }

        this.current_img_modifier.zoom /= 1.1;
        
        if (this.current_img_modifier.zoom < this.min_zoom){
            this.current_img_modifier.zoom = this.min_zoom;
        }
        
        if (Math.abs(this.current_img_modifier.zoom - 1) < 0.05){
            this.current_img_modifier.y_offset = 0;
            this.current_img_modifier.x_offset = 0;
        }

        this.transform();
    }

    get_img_size(){
        return {
            width: this.img_obj.naturalWidth, 
            height: this.img_obj.naturalHeight
        };
    }

    set_zoom(z){
        this.current_img_modifier.zoom = z;
        this.transform();
    }

    copy_zoom(img, force = false){
        const this_size = this.get_img_size();
        const img_size  = img.get_img_size();

        if (
            this_size.width !== img_size.width || this_size.height !== img_size.height
        ){
            return;
        }

        if (!force && (
            this.current_img_modifier.zoom !== 1
            || this.current_img_modifier.x_offset !== 0
            || this.current_img_modifier.y_offset !== 0
        )) {
            return;
        }

        this.current_img_modifier = {
            ...img.current_img_modifier
        }

        this.transform();
    }

    set_points(points, save_change = true){
        // Sets all points (usually from another images points)
        this.points = points.map(p => { return {...p}}); // Copy them instead of using references
        this.possible_keypoints.forEach(kp => {
            let kp_set = false;
            this.points.forEach(p => {
                if (p.id  == kp.id){
                    kp.img_point.set_current_img_point(p);
                    kp_set = true;
                }
            });
            if (!kp_set){
                kp.img_point.reset();
            }
        });
        
        this.save_change(save_change);
    }

    transform(){
        function cap(x, a, b){
            if (x < a) return a;
            if (x > b) return b;
            return x;
        }

        function bound_img_translate(){
            // How to calcluate bounds properly?
            const { width: actual_width, height: actual_height } = this.canvas.getBoundingClientRect()
            if (actual_width == null || actual_height == null) return;

            this.current_img_modifier.x_offset = cap(
                this.current_img_modifier.x_offset,
                - actual_width + 100, // 100 px should still be in actual viewport
                actual_width - 100
            );

            this.current_img_modifier.y_offset = cap(
                this.current_img_modifier.y_offset,
                - actual_height + 100,
                actual_height - 100
            );
        }

        bound_img_translate.bind(this)();
        
        if (Math.abs(this.current_img_modifier.zoom - this.max_zoom) < 0.05){
            document.getElementById("zoom_out_btn")?.classList.remove("disable");
            document.getElementById("zoom_in_btn")?.classList.add("disable");

            
        } else if (Math.abs(this.current_img_modifier.zoom - this.min_zoom) < 0.05){
            document.getElementById("zoom_out_btn")?.classList.add("disable");
            document.getElementById("zoom_in_btn")?.classList.remove("disable");
        } else {
            document.getElementById("zoom_out_btn")?.classList.remove("disable");
            document.getElementById("zoom_in_btn")?.classList.remove("disable");
        }

        this.canvas.style.transform  = `scale(${ this.current_img_modifier.zoom }) translate(${ this.current_img_modifier.x_offset }px, ${ this.current_img_modifier.y_offset }px)`;
        this.img_obj.style.transform = `scale(${ this.current_img_modifier.zoom }) translate(${ this.current_img_modifier.x_offset }px, ${ this.current_img_modifier.y_offset }px)`;
        this.possible_keypoints.forEach(p => {
            p.img_point.scale(1/this.current_img_modifier.zoom);
        });
        this.possible_joints.forEach(j => {
            j.img_joint.scale(1/this.current_img_modifier.zoom);
        });
    }

    img_move_pressed(action){
        const action_data = action.get_data();
        this.currently_dragging_img = action_data.event_type == "key_down";
        set_current_cursor_display(this.currently_dragging_img ? "dragging" : null);

        this.dragging_start_pos     = {
            start_x_offset: this.current_img_modifier.x_offset,
            start_y_offset: this.current_img_modifier.y_offset,
            start_cursor_x: action_data.mouse_pos[0],
            start_cursor_y: action_data.mouse_pos[1]
        };
    }

    image_mouse_event(type, e){
        if (type == "mousemove"){
            if (!this.currently_dragging_img){
                return;
            }
            this.current_img_modifier.x_offset = this.dragging_start_pos.start_x_offset - (this.dragging_start_pos.start_cursor_x - e.clientX);
            this.current_img_modifier.y_offset = this.dragging_start_pos.start_y_offset - (this.dragging_start_pos.start_cursor_y - e.clientY);
            this.transform();

            return;
        }
        
        if (type == "mouseleave"){
            this.currently_dragging_img = false;
            this.mouse_over_img = false;
        }

        if (this.current_interaction_mode == "drag"){
            if (type == "right_click_down"){
                this.currently_dragging_img = true;
                set_current_cursor_display("dragging");
                
                this.dragging_start_pos = {
                    start_x_offset: this.current_img_modifier.x_offset,
                    start_y_offset: this.current_img_modifier.y_offset,
                    start_cursor_x: e.clientX,
                    start_cursor_y: e.clientY
                };
            } else if (type == "right_click_up" || type == "mouseleave"){
                this.currently_dragging_img = false;
                set_current_cursor_display("drag");
            }
        }
    }

    set_interaction_mode(mode, move_next = "move_next_unannotated"){
        if (!is_editing_mode() && mode !== "drag"){
            const mode_btn = document.getElementById("annotate_mode_btn");
            mode_btn?.classList.remove("active");
            mode_btn?.classList.add("disable");
            const variant_mode_btn = document.getElementById("variant_annotate_mode_btn");
            variant_mode_btn?.classList.remove("active");
            variant_mode_btn?.classList.add("disable");
            document.getElementById("drag_mode_btn")?.classList.remove("active");
            return;
        }
        
        if (mode == "drag"){
            set_current_cursor_display("drag");
            document.getElementById("drag_mode_btn")?.classList.add("active");
            document.getElementById("annotate_mode_btn")?.classList.remove("active");
            document.getElementById("variant_annotate_mode_btn")?.classList.remove("active");
        } else if (mode == "annotate"){
            set_current_cursor_display(null);
            document.getElementById("drag_mode_btn")?.classList.remove("active");

            if (move_next == "move_next_unannotated"){
                document.getElementById("annotate_mode_btn")?.classList.add("active");
                document.getElementById("variant_annotate_mode_btn")?.classList.remove("active");
                keypoint_toolbar.toggle_keypoint_focus_mode("unannotated");
            } else {
                document.getElementById("annotate_mode_btn")?.classList.remove("active");
                document.getElementById("variant_annotate_mode_btn")?.classList.add("active");
                keypoint_toolbar.toggle_keypoint_focus_mode("next");
            }
        } else {
            throw new Error("Unsupported interaction mode: " + mode);
        }

        this.current_interaction_mode = mode;
    }

    click_hits_point(mouse_event){
        for (const pt of this.possible_keypoints){
            const bb = pt.img_point.el?.getBoundingClientRect();
            if (!bb){
                continue;
            }

            const center = [
                bb.x + bb.width/2,
                bb.y + bb.height/2
            ];

            const r = Math.sqrt(
                (center[0] - mouse_event.clientX) ** 2 
                + (center[1] - mouse_event.clientY) ** 2
            );

            if (r < 12/2){
                return pt;
            }
        }
        
        return false
    }

    set_annotation_as_is_fun(){
        const old_points_copy = JSON.parse(JSON.stringify(this.points));
        return (() => { 
            this.set_points(
                old_points_copy,
                false
            );
        }).bind(this)
    }

    save_change(undo_redo = true){
        this.render();
        upload_data_to_server();
        if (undo_redo) this.undo_redo.push(this.set_annotation_as_is_fun())
    }
}

function set_current_cursor_display(type){
    document.body.classList.forEach(className => {
        if (className.startsWith('cursor_')) {
            document.body.classList.remove(className);
        }
    });

    if (type) document.body.classList.add(`cursor_${type}`);
}