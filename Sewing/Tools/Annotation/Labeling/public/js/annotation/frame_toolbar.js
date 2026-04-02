class FrameToolbar{
    constructor(){
        this.active_img = null;

        event_handler.subscribe("activate_img", ((action) => {
            // Assumes current slide is the active image, the rest of dom manipulation will be done here
            
            const img_id = action.get_data().id;
        
            this.active_img = images.filter(img => img.get_id() == img_id)[0];
            this.active_img.activate();
            setImgContainerWidth();
        }).bind(this));
    }

    get_active_img(){
       return active_img; // See active_elements.js
    }

    get_prev_img(cycle = true){
        const images = iter_images();

        const current_index = images.indexOf(this.active_img);
        if (!cycle && current_index == 0) {
            return null;
        }

        const new_img_index = (current_index - 1 + images.length) % images.length;
        return iter_images()[new_img_index];
    }

    activate_next_img(cycle = true){ // cycle determines if at last img we go to first one.
        const images = iter_images();

        const current_index = images.indexOf(this.active_img);
        if (!cycle && current_index + 1 == images.length) {
            return;
        }

        const new_img_index = (current_index + 1) % images.length;
        this.activate_img(get_img_id_from_index(new_img_index));
    }

    activate_prev_img(cycle = true){
        const prev = this.get_prev_img(cycle);
        if (prev){
            this.activate_img(prev);
        }
    }

    change_frame_toolbar_display_to(frame_id, change_to, is_active_img = False) {
        const el = get_all_elements_of_path_with_property("._hu_frame_element", "_id", "" + frame_id)[0];
      
        const updateToolbarDisplay = (...add_classes) => {
            change_classes(el, [
                "frame_toolbar_image_skipped",
                "active",
                "success",
                "disable",
                "current_active_img"
            ], add_classes);
        };
      
        const classUpdates = {
            skipped: ["frame_toolbar_image_skipped"], // ["active", "success"],
            annotated: ["success"],
            "partially annotated": [],
            unannotated: ["disable"],

            /* removed: ["frame_toolbar_img_removed"],
            current_removed: ["active", "frame_toolbar_img_removed"] */
        };
      
        let classesToAdd = classUpdates[change_to];
        if (classesToAdd) {
            if (is_active_img){
                classesToAdd = [...classesToAdd, "current_active_img"];
            }
            updateToolbarDisplay(...classesToAdd);
        } else {
            throw new Error("Unexpected frame_toolbar change_to: ", change_to);
        }
    }

    activate_img(img_id){
        swiper_objects.swiper_stage.slideTo(get_img_index_from_id(img_id), 0);
        event_handler.emmit(
            new Action("activate_img", { 
                id: img_id
            })
        );
    }

    render_frame_toolbar_UI(img_id){
        // Don't call this function directly, use
        /*
            event_handler.emmit(
                new Action("activate_img", { 
                    id: get_img_id_from_index(new_img_index)
                })
            );
        */
        // instead. This function unly does UI changes

        for (const img of iter_images()) {
            if (!img.should_be_used()){
                this.change_frame_toolbar_display_to(img.id, "skipped", img.get_id() === img_id);
            } else if (img.is_annotated()){
                this.change_frame_toolbar_display_to(img.id, "annotated", img.get_id() === img_id);
            } else if (img.is_partially_annotated()){
                this.change_frame_toolbar_display_to(img.id, "partially annotated", img.get_id() === img_id);
            } else {
                this.change_frame_toolbar_display_to(img.id, "unannotated", img.get_id() === img_id);
            }
        }
    }
    
    get_img_from_id(img_id){
        return images.filter(img => img.get_id() == img_id)[0]
    }

    skip_img(img_id, e) {
        e.stopPropagation();
        e.preventDefault();
    
        this.activate_img(img_id);
        const currently_activated = this.get_active_img().toggle_skip_img();
        if (!currently_activated){
            this.activate_next_img(false);
        } else {
            this.render_frame_toolbar_UI(this.get_active_img().id);
        }
    }

    delete_current_img_points(e){
        const img = this.get_active_img();
        img.reset();
    }

    copy_from_img(img_id, e){
        const copy_from = this.get_img_from_id(img_id);
        const img = this.get_active_img();

        const new_points_copy = JSON.parse(JSON.stringify(copy_from.points));

        img.set_points(
            new_points_copy
        )

        e?.stopPropagation();
        e?.preventDefault();
    }
}