class Spline_Preview{
    constructor(spline){
        this.spline = spline;
        this.id = spline.get_id();
        this.name = spline.get_name();
        this.is_base_spline = spline.is_base_spline();

        this.preview_el = document.createElement('div');
        this.preview_el.innerHTML = `
            <div class="spline_preview" _id="${ this.id }" _is_basic_spline="true">
                <div class="spline_preview_svg_wrapper">
                    <svg viewBox="0 0 1000 300"></svg>
                </div>
                <div class="spline_preview_spline_name">${ this.name }</div>
            </div>`;

        if (this.is_base_spline){
            document.querySelector('#side_selection .spline_list_wrapper.base_spline_wrapper .spline_list').appendChild(this.preview_el);
        } else {
            const parent = document.querySelector('#side_selection .spline_list_wrapper.custom_spline_wrapper .spline_list');
            const lastChild = parent.lastElementChild;

            parent.insertBefore(this.preview_el, lastChild);
        }
            
        this.visibleViewbox = [700, 300]; // [width, height]
        this.svg = new SVG(this.preview_el.getElementsByTagName("svg")[0]);
        this.display_elements = [];
    }

    bb_from(x0, y0, x1, y1){
        const r = {
            x0, y0, x1, y1
        };
        
        return {
            ...r,
            width:  r.x1 - r.x0,
            height: r.y1 - r.y0,
            aspect_ratio: (r.x1 - r.x0) / (r.y1 - r.y0)
        }
    }

    render(){
        const padding = 50;

        this.display_elements = this.spline.draw_as_preview(
            this.bb_from(padding, padding, this.visibleViewbox[0] - padding, this.visibleViewbox[1] - padding)
        );

        this.display_elements.forEach(e => this.svg.add_dom_element(e));
    }
}