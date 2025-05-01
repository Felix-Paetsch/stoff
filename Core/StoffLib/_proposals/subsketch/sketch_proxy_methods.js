let pts = [];
let lns = [];

export const sketch_get_dict = {
    "get_points": function (){
        return pts;
    },
    "get_lines": function (){
        return lns;
    },
    "add_point": function (pt){
        const p = this.parentSketch.add_point(this._deproxify(pt));
        const prox = this._proxify(p);
        pts.push(prox);
        return prox;
    },
    "add_line": function (ln){
        const l = this.parentSketch.add_line(this._deproxify(ln));
        const prox = this._proxify(l);
        lns.push(prox);
        return prox;
    },
    "remove_point": function (pt){
        this.parentSketch.remove_point(this._deproxify(pt));
        pts = pts.remove(pt);
    },
    "remove_line": function (ln){
        this.parentSketch.remove_line(this._deproxify(ln));
        lns = lns.remove(ln);
    },
    "toString": function () { return `[Sub${ this._deproxify().toString().slice(1, -1) }]` }
}

export function initialize_sketch_proxy(proxySketch, {points, lines}){
    pts = proxySketch.make_sketch_element_collection(points.map(proxySketch._proxify));
    lns = proxySketch.make_sketch_element_collection(lines.map(proxySketch._proxify));
}