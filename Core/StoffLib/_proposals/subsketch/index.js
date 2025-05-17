import { initialize_sketch_proxy, sketch_get_dict } from "./sketch_proxy_methods.js";
import { proxy_point } from "./point_proxy.js";
import { proxy_line } from "./line_proxy.js";
import Line from "../line.js";
import Sketch from "../sketch.js";

export default function create_subsketch(sketch, elements){
    const ex_pts = elements.get_points();
    const ex_lns = elements.get_lines();
    ex_lns.forEach(ln => {
        ln.get_endpoints().forEach(p => {
            if (!ex_pts.includes(p)){
                ex_pts.push(p);
            }
        });
    });

    const ProxySketch = new Proxy(sketch, {
        get(obj, prop) {
            if (prop == "sourceSketch") return sketch.sourceSketch;
            if (prop == "points") return ProxySketch.get_points();
            if (prop == "lines") return ProxySketch.get_lines();

            return sketch_get_dict[prop] ? sketch_get_dict[prop].bind(ProxySketch) : obj[prop];
        },
        set(obj, prop, value) {
            if (prop == "points" || prop == "lines"){
                throw new Error("Felix has to do something.");
            }
            return obj[prop] = value;
        }
    });

    ProxySketch._proxify = (el) => proxify(el, ProxySketch);
    ProxySketch._deproxify = (el) => deproxify(el, sketch);

    initialize_sketch_proxy(ProxySketch, {
        points: ex_pts,
        lines:  ex_lns
    });

    return ProxySketch;
}

function proxify(el, proxySketch){
    if (el instanceof Line) return proxy_line(el.sourceLine, proxySketch);
    if (el instanceof Point) return proxy_point(el.sourcePoint, proxySketch);
    if (el instanceof Sketch) return proxySketch;
    return proxySketch;
}

function deproxify(el, real_element){
    return el ? el.sourceSketch || el.sourcePoint || el.sourceLine : real_element;
}