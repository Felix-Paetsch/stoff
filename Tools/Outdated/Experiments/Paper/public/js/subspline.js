class Relative_Subspline{
    constructor(anchors, spline){
        this.spline = spline;
        this.anchors = anchors; // relative to <0,0>, <1,0> (base vectors, might not be <1,0> anymore)
    }

    get_bb(vec1, vec2){
        return this.spline.get_bb(vec1, vec2);
    }

    get_id(){
        return this.spline.get_id();
    }
}

class Renderable_Subspline{
    constructor(anchors, spline, main_canvas){
        this.anchors = anchors;
        this.spline = spline;

        this.svg = main_canvas.svg;
        this.elements = [];

        this.subspline_attributes = {"_subspline": this};
    }

    set_elements_attribute(key, value){
        this.subspline_attributes[key] = value;
        this.elements.forEach(e => {
            e[key]= value;
        });
    }

    get_id(){
        return this.spline.get_id();
    }

    set_styles(style_name){
        if (this.elements){
            this.remove_from_dom();
        }

        this.elements = this.spline.draw_at(this.anchors[0].vec, this.anchors[1].vec, style_name); // For main canvas
        this.elements.forEach(e => {
            for (const key in this.subspline_attributes) {
                e[key] = this.subspline_attributes[key];
            }
        });
        this.svg.add_dom_elements(this.elements);
    }

    get_bb(vec1, vec2){
        return this.spline.get_bb(vec1, vec2);
    }

    remove_from_dom(){
        this.svg.remove_dom_elements(this.elements);
        this.elements = [];
    }
}