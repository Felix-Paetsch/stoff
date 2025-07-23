const svg_elements = {};

{
    const allowed_objects = [
        ["circle", "circle"],
        ["line",   "line"]
    ]

    for (let [local_name, dom_name] of allowed_objects){
        svg_elements[local_name] = (default_styles = null) => {
            const svgNamespace = "http://www.w3.org/2000/svg";
            const el = document.createElementNS(svgNamespace, dom_name);
            el.setAttribute("_svg_ident", local_name);
            el.$ = new SVG_element_modifier(el, local_name);
            if (default_styles){
                el.$.set_styles(default_styles);
            }
            return el;
        }
    }
}

/*
Styles Names I want to have:
============================
Global: main_canvas_selected, main_canvas_default, preview - can be passed around, not necessarily a point or line style

P: main_canvas_selected
P: main_canvas_default
P: preview_outer
P: preview_inner

L: main_canvas_default
L: main_canvas_selected
L: preview

Maybe later: refactor stuff such that it can be a list of elements whcih belong together (e.g. more complicated circles with outlines/...)
*/

const svg_default_styles = {
    "circle": {
        "anchor": {
            "stroke": "white",
            "stroke_width": 2
        },
        "no_anchor": {
            "stroke_width": 0
        },
        "main_canvas_default": {
            "radius": 8,
            "fill": "#484D6D",
            "display": "block",
            "clickable": "none",
            "z": 70
        },
        "main_canvas_selected_latest": {
            "radius": 10,
            "fill": "#81F7E5",
            "z": 75,
            "clickable": "none",
            "display": "block"
        },
        "main_canvas_selected_2": {
            "radius": 8,
            "fill": "#A9F8FB",
            "z": 75,
            "clickable": "none",
            "display": "block"
        },
        "adjacent_new_spline_insert": {
            "radius": 8,
            "fill": "#DAA520",
            "z": 75,
            "clickable": "none",
            "display": "block"
        },
        "preview_outer": {
            "radius": 10,
            "fill": "#81F7E5",
            "z": 75,
            "clickable": "none",
            "display": "block"
        },
        "preview_inner": {
            "radius": 8,
            "fill": "#484D6D",
            "z": 70,
            "clickable": "none",
            "display": "block"
        }
    },
    "line": {
        "preview": {
            "z": 65,
            "stroke": "#57A773",
            "stroke_width": 3
        },
        "main_canvas_default": {
            "z": 65,
            "stroke": "#57A773",
            "stroke_width": 5
        },
        "main_canvas_selected": {
            "z": 68,
            "stroke": "#840032",
            "stroke_width": 5
        }
    }
};

const svg_attribute_map = {
    // Longform: [shortform_local, domform, type = "attribute" || "style"]
    "radius": ["r", "r", "attribute"],
    "fill":   ["fill", "fill", "attribute"],
    "z": ["z", "z", "attribute"],
    "clickable": ["clickable", "user-select", "style"],
    "display": ["display", "display", "style"],
    "stroke": ["stroke", "stroke", "attribute"],
    "stroke_width": ["width", "stroke-width", "attribute"],

    "x": ["x", "cx", "attribute"],
    "y": ["y", "cy", "attribute"],

    "x1": ["x1", "x1", "attribute"],
    "y1": ["y1", "y1", "attribute"],
    "x2": ["x2", "x2", "attribute"],
    "y2": ["y2", "y2", "attribute"],
}

class SVG_element_modifier{
    constructor(el, type){
        this.el = el;
        this.element = el;
        this.$ = el;

        this.type = type.toLowerCase();

        for (let key in svg_attribute_map) {
            this[`set_${ key }`] = ((val) => {
                const [_, dom_form, type] = svg_attribute_map[key];
                if (type == "attribute") {
                    this.el.setAttribute(dom_form, val);
                } else if (type == "style"){
                    this.el.style[dom_form] = val;
                }
                return this;
            }).bind(this);
        }
    }

    set_pos(p1,p2=null){return this.set_position(p1,p2);}
    set_position(p1, p2 = null){
        // p1 = vec || p1 = arr[x,y] || p1 = x, p2 = y
        if (p2 !== null){
            p1 = [p1, p2];
        }

        this.el.setAttribute("cx", p1[0]);
        this.el.setAttribute("cy", p1[1]);
        return this;
    }

    set_endpoints(a,b,c,d){
        // arr[a,b,c,d] || vec, vec || arr[x,y] arr[x,y] || x1,x2,y1,y2
        if (Array.isArray(a)){
            return this.set_endpoints(...a)
        }

        if (typeof c == "undefined"){
            return this.set_endpoints(a[0], a[1], b[0], b[1])
        }

        this.el.setAttribute("x1", a);
        this.el.setAttribute("y1", b);
        this.el.setAttribute("x2", c);
        this.el.setAttribute("y2", d);
        return this;
    }

    set_styles(styles){
        if (typeof styles == "undefined"){
            throw new Error("Styles is not defined!");
        }

        if (typeof styles == "string"){
            const s = svg_default_styles[this.type][styles];
            if (typeof s == "undefined"){
                throw new Error("Styles: ", styles, "Not defined for type:", this.type);
            }
            return this.set_styles(s);
        }

        for (let key in svg_attribute_map) {
            const [short_form, dom_form, _] = svg_attribute_map[key];
            let actual_key = null;

            for (const k of [key, short_form, dom_form]){
                if (styles.hasOwnProperty(k)){
                    actual_key = k
                }
            }
           
            if (actual_key){
                this[`set_${ key }`](styles[actual_key]);
            }
        }

        if (styles.hasOwnProperty("pos")){
            this.set_position(styles["pos"]);
        }

        if (styles.hasOwnProperty("endpoints")){
            this.set_endpoints(...styles["endpoints"]);
        }

        return this;
    }
}