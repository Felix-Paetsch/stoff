export function proxy_line(ln, proxySketch){
    ln = ln.sourceLine;
    const proxyLine = new Proxy(ln, {
        get(obj, prop) {
            if (prop == "sourceLine") return ln;
            if (prop == "sketch") return proxySketch;
            if (prop == "sourceSketch") return ln.sketch;
            if (prop == "_proxify") return (...args) => proxySketch._proxify(...args);
            if (prop == "_deproxify") return (...args) => proxySketch._deproxify(...args, ln);
            if (prop == "p1") return proxySketch._proxify(ln.p1);
            if (prop == "p2") return proxySketch._proxify(ln.p2);
            return line_get_dict[prop] ? line_get_dict[prop].bind(proxyLine) : obj[prop];
        },
        set(obj, prop, value) {
            return obj[prop] = value;
        }
    });
    return proxyLine;
}

const line_get_dict = {
    "set_endpoints": function (p1, p2){
        this._deproxify().set_endpoints(this._deproxify(p1), this._deproxify(p2));
        return this;
    }
}