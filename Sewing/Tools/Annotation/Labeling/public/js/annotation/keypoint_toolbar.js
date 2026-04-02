class KeypointToolbar{
    constructor(){
        this.active_point = null;
        this.point_data = frontend_vars.point_data;
        this.current_img = null;

        this.no_sticky_points = true;

        this.currently_dragging = false;
        this.subscribe_to_events();
    }

    get_active_point(){
        return this.active_point ? this.active_point : this.point_data[0];
    }

    subscribe_to_events(){
        event_handler.subscribe("set_active_point", ((action) => {
            this.set_active_point_from_id(action.get_data().id);
        }).bind(this));

        event_handler.subscribe("skip_point", ((action) => {
            this.toggle_skip_point(action.get_data().id)
        }).bind(this));

        event_handler.subscribe("hide_point", ((action) => {
            this.toggle_hide_point(action.get_data().id)
        }).bind(this));
    }

    set_active_img(img_obj){
        this.current_img = img_obj;
        this.set_first_unannotated_img_point();
    }

    set_active_point_from_id(id){
        this.set_active_point(this.get_point_object_index_from_id(id))
    }

    set_first_unannotated_img_point(){
        for (let i = 0; i < this.point_data.length; i++){
            if (!this.current_img.point_is_annotated(this.point_data[i].id)){
                return this.set_active_point(i);
            }
        }

        this.set_active_point(this.point_data.length - 1);
    }

    set_first_point_active(){
        this.set_active_point(0);
    }

    set_active_point(index){
        if (this.point_data.length == 0){
            return;
        }

        this.current_img.automatically_activate_next_pt = true;

        if (index > 0 && !this.current_img.point_is_annotated(this.point_data[index - 1].id) && CONF["annotate_points_in_order"]){
            return console.log("Prev points have not been set!");
        }

        this.active_point = this.point_data[index];
        this.render_toolbar();
        this.current_img.render();

        // Set navigator correct point
        const nav_img_points = document.getElementsByClassName("_hu_navigator_img_point"); 
        // Bcs swiper does something strange, there are multiple of each
        for (let i = 0; i < nav_img_points.length; i++){
            if (nav_img_points[i].getAttribute("_point_id") == this.get_active_point().id){
                add_classes(nav_img_points[i], ["selected_keypoint_in_navigator"])
            } else {
                remove_classes(nav_img_points[i], ["selected_keypoint_in_navigator"]);
            }
        }

        
        // Scroll Point into view in toolbar
        const point_toolbar_div = get_all_elements_of_path_with_property("._hu_keypoint_element", "_id", "" + this.get_active_point().id)[0];
        point_toolbar_div.scrollIntoView({ block: 'nearest' });
    }

    activate_following_pt(){
        if (CONF.new_point_selection_mode == "unannotated"){
            this.activate_next_non_annotated();
        } else if (CONF.new_point_selection_mode == "next"){
            this.activate_next_point(false);
        } else if (CONF.new_point_selection_mode == "next_cycle"){
            this.activate_next_point(true);
        } else {
            return;
        }
    }

    toggle_keypoint_focus_mode(to = null){
        const options = ["none", "unannotated", "next", "next_cycle"];
        let to_activate = to;
        if (!to){
            const current_index = options.indexOf(CONF.new_point_selection_mode);
            to_activate = options[(current_index + 1) % options.length]
        }

        CONF.new_point_selection_mode = to_activate;
    }

    activate_next_non_annotated(){
        // The next non_annotated points
        const current_index = this.point_data.indexOf(this.active_point);
        for (let i = 1; i < this.point_data.length; i++){
            if (!this.current_img.point_is_annotated(this.point_data[(current_index + i) % this.point_data.length].id)){
                return this.set_active_point(
                    (current_index + i) % this.point_data.length
                );
            }
        }

        this.set_active_point(
            this.point_data.length - 1
        );
    }

    activate_next_point(cycle = true){ // cycle determines if at last point we go to first one.
        // THe next point, independed of anntated
        if (typeof this.active_point == "undefined"){
            this.set_first_point_active()
        } else {
            const current_index = this.point_data.indexOf(this.active_point);
            if (!cycle && current_index + 1 == this.point_data.length) {
                return;
            }
            this.set_active_point(
                (current_index + 1) % this.point_data.length
            );
        }
    }

    activate_prev_point(){
        if (typeof this.active_point == "undefined"){
            this.set_first_point_active()
        } else {
            const current_index = this.point_data.indexOf(this.active_point);
            this.set_active_point(
                (current_index - 1 + this.point_data.length) % this.point_data.length
            );
        }
    }

    image_mouse_event(type, e){
        if (get_active_img().currently_dragging_img){
            return;
        }

        if (type == "mousemove"){
            if (this.currently_dragging){
                this.current_img.user_set_point(e, true, false);
            }
            return;
        }

        if (type == "right_click_down"){
            const clicked_pt = this.current_img.click_hits_point(e);

            if (clicked_pt){
                this.set_active_point_from_id(clicked_pt.id);
                this.current_img.automatically_activate_next_pt = false;
            }

            this.current_img.user_set_point(e, true, false);
            return this.currently_dragging = true;
        }

        if (type == "right_click_up"){
            this.current_img.user_set_point(e);
            return this.currently_dragging = false;
        }
    }

    get_point_object_index_from_id(id){
        for (let i = 0; i < this.point_data.length; i++){
            if (this.point_data[i].id == id) return i;
        }
        return -1;
    }

    get_point_object_from_id(id){
        return this.point_data.filter(x => x.id == id)[0];
    }

    get_point_id_from_index(index){
        return this.point_data[index].id;
    }

    get_all_point_objects(){
        return this.point_data
    }

    render_toolbar(){
        if (this.point_data.length == 0){
            return;
        }

        function _change_point_toolbar_display_single_point(point_id, is_current = false) {
            const els   = get_all_elements_of_path_with_property("._hu_keypoint_element", "_id", point_id);
            const state = this.current_img.get_point_from_id(point_id).state;

            const classes_to_add    = [];
            const classes_to_remove = [];

            const apply_classes = {
                "invisible_keypoint": false,        // Whether circle is dotted
                "success": false,                   // Green font
                "selected_keypoint": is_current,    // Blue background color, changed font
                "unannotated_keypoint": false,      // Grayish color
                "skipped_keypoint": false,          // Cross out
            };
        
            if (state == "visible"){
                apply_classes.success = true;
            } else if (state == "hidden"){
                apply_classes.invisible_keypoint = true;
            } else if (state == "skipped") {
                apply_classes.skipped_keypoint = true;
            } else {
                apply_classes.unannotated_keypoint = true;
            }

            for (const key in apply_classes) {
                if (apply_classes[key]) {
                    classes_to_add.push(key);
                } else {
                    classes_to_remove.push(key);
                }
            }            
        
            for (const element of els){
                element.setAttribute("_current_state", state);
            
                change_classes(element, classes_to_remove, classes_to_add);
            }
        }

        const change_point_toolbar_display_single_point = _change_point_toolbar_display_single_point.bind(this);

        for (const point of this.point_data){
            change_point_toolbar_display_single_point(point.id);
        }
    
        if (is_editing_mode()){
            change_point_toolbar_display_single_point(this.active_point.id, true);
        }
    }

    toggle_hide_point(point_id) {
        this.current_img.toggle_hide_point(point_id);
        // The .render() call is made by the img
    }

    toggle_skip_point(point_id) {
        this.current_img.toggle_skip_point(point_id);
        // The .render() call is made by the img
    }
}