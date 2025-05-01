class ImgPoint{
    constructor(project_point, img){
        this.project_point = project_point;
        this.el        = null;
        this.img       = img;
        this.canvas    = this.img.canvas;
        this.point_obj = null;
        this.scale_val = 1;
    }

    remove(){
        // Removes point element from canvas
        if (this.el){
            this.el.parentNode.removeChild(this.el);
            this.el = null;
        }
    }

    reset(){
        // Removes point element and image point reference
        this.remove();
        this.point_obj = null;
    }

    set_current_img_point(img_point){
        this.point_obj = img_point;
    }

    create_own_element(){
        // Create Point Div
        if (this.el){ return; }

        this.el = document.createElement('div');
        this.el.classList.add('_hu_point');
        this.el.setAttribute('_id', this.project_point.id);
        this.el.style.position = 'absolute';
        this.el.style.width = `${2 * frontend_vars.point_radius}px`;
        this.el.style.height = `${2 * frontend_vars.point_radius}px`;
        this.el.style.borderRadius = '50%';
        this.el.style.zIndex = '50';

        if (!this.canvas){ throw new Error("Point canvas is not defined!"); }
        this.canvas.appendChild(this.el);
    }

    scale(val){
        // Scale point div
        this.scale_val = val;
        if (this.el){
            this.el.style.transform = `scale(${this.scale_val})`;
        }
    }

    position_in_img_set(){
        // Point has position inside image
        return ["visible", "hidden"].includes(this.point_obj?.state) && typeof this.point_obj?.widthPercent == "number"
    }

    render_as_current(rerender = true){
        // Render point as currently selected point
        if (rerender){
            this.render();
        }

        if (!this.position_in_img_set()) return;
        add_classes(this.el, ["selected_keypoint_in_img"]);
    }

    render(){
        // Render point div
        if (this.point_obj == null || ["skipped", "unannotated"].includes(this.point_obj.state)) {
            this.remove();
            this.point_obj = this.img.points.filter(p => p.point_id == this.project_point.id)[0];

            if (!this.point_obj || !this.point_obj.state || ["skipped", "unannotated"].includes(this.point_obj.state)){
                return this.point_obj = null;
            }
        }

        if (!this.position_in_img_set()) return;

        this.create_own_element();

        this.el.style.left =  `calc(${ this.point_obj.widthPercent }% - ${frontend_vars.point_radius}px)`;
        this.el.style.top = `calc(${ this.point_obj.heightPercent  }% - ${frontend_vars.point_radius}px)`;
        this.el.style.transform = `scale(${this.scale_val})`;

        if (this.point_obj.state == "hidden"){
            change_classes(this.el, ["visible_point", "selected_keypoint_in_img"], ["hidden_point"]);
        } else {
            change_classes(this.el, ["hidden_point", "selected_keypoint_in_img"], ["visible_point"]);
        }

        return this.el;
    }
}