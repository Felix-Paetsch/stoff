import { Sewing } from "../Sewing/sewing";
import { wrap_sewing_methods } from "../Sewing/wrap_sewing_methods";
import { Sketch } from "../StoffLib/sketch";
import { wrap_sketch_methods } from "../StoffLib/sketch_methods/wrap_sketch_methods";
import { Toggle } from "../utils/prototype_modification";

export type Rendereable = Sketch | Sewing | Sketch[];
export type DebugListener = (s: Rendereable, descriptor_data?: { [key: string]: any }) => void;

const debug_listener: DebugListener[] = [];
const hot_debug_listener: DebugListener[] = [];

export function debug_render(s: Rendereable, descriptor_data: { [key: string]: any } = {}) {
    const frozen_to_render = s instanceof Sewing ? s : Array.isArray(s) ? s.map(s => s.copy()) : s.copy();
    debug_listener.forEach(l => l(frozen_to_render, descriptor_data));
}

export function hot_debug_render(s: Rendereable, descriptor_data: { [key: string]: any } = {}): Toggle {
    if (s instanceof Sketch) {
        return wrap_sketch_methods(
            s,
            (evaluate) => {
                const res = evaluate();
                hot_debug_listener.forEach(l => l(s.copy(), descriptor_data));
                return res;
            }
        )
    }

    if (Array.isArray(s)) {
        const toggles: Toggle[] = s.map(sk => {
            return wrap_sketch_methods(
                sk,
                (evaluate) => {
                    const res = evaluate();
                    hot_debug_listener.forEach(l => l(
                        s.map(r => r.copy()),
                        descriptor_data
                    ));
                    return res;
                }
            )
        });

        return (to?: boolean) => {
            if (toggles.length == 0) return true;
            return toggles.map(t => t(to))[0];
        }
    }

    return wrap_sewing_methods(
        s,
        (evaluate) => {
            const res = evaluate();
            hot_debug_listener.forEach(l => l(s.copy(), descriptor_data));
            return res;
        }
    )
}

export function register_debug_render_listener(l: DebugListener) {
    debug_listener.push(l);
}

export function register_hot_debug_render_listener(l: DebugListener) {
    hot_debug_listener.push(l);
}
