class Point{
    constructor(vec, main_canvas){
        this.vec = vec;
        this.el  = this.create_el();
        this.svg = main_canvas.svg;
        this.svg.add_dom_element(this.el);
        this.$ = this.el.$;
    }

    set_position(x,y){
        this.vec = new Vector(x,y);
        this.set_styles({x,y});
    }

    create_el(){
        const circle = svg_elements.circle().$
            .set_styles("main_canvas_default")
            .set_position(this.vec).$;
        
        circle._point_el = this;
        return circle;
    }

    set_styles(...x){
        return this.$.set_styles(...x).$
    }

    remove_from_dom(){
        this.svg.remove_dom_element(this.el);
    }
}