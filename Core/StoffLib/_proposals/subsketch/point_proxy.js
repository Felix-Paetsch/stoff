export function proxy_point(pt, proxySketch){
    pt = pt.sourcePoint;
    const proxyPoint = new Proxy(pt, {
        get(obj, prop) {
            if (prop == "sourcePoint") return pt;
            if (prop == "sketch") return proxySketch;
            if (prop == "sourceSketch") return pt.sketch;
            if (prop == "_proxify") return (...args) => proxySketch._proxify(...args);
            if (prop == "_deproxify") return (...args) => proxySketch._deproxify(...args, pt);
            if (prop == "adjacent_lines") return proxyPoint.get_lines();
            return point_get_dict[prop] ? point_get_dict[prop].bind(proxyPoint) : obj[prop];
        },
        set(obj, prop, value) {
            return obj[prop] = value;
        }
    });
    return proxyPoint;
}

const point_get_dict = {
    "add_adjacent_line": (line) => {
        const l = this._deproxify().add_adjacent_line(this._deproxify(line));
        return this._proxify(l);
    },
    "get_lines": () => {
        return this.make_sketch_element_collection(
            ...this._deproxify().get_lines().filter(
                l => this.sketch.lines.some(m => m.eq(l))
            ).map(this.proxify)
        );
    }
}