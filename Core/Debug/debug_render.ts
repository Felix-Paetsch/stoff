import { Sewing } from "../Sewing/sewing";
import { wrap_sewing_methods } from "../Sewing/wrap_sewing_methods";
import { Sketch } from "../StoffLib/sketch";
import { wrap_sketch_methods } from "../StoffLib/sketch_methods/wrap_sketch_methods";
import { Toggle, wrap_object_methods } from "../utils/prototype_modification";
import { Recording } from "./recording";

export type Rendereable = Sketch | Sewing | Sketch[] | Recording;
export type DebugListener = (s: Rendereable, data: any) => void;
export type HotDebugListener = (
    s: Rendereable,
    id: string,
    data: any
) => void;

type ListenerEntry<T> = {
    id: string;
    fn: T;
};


const debug_listener: ListenerEntry<DebugListener>[] = [];
const hot_debug_listener: ListenerEntry<HotDebugListener>[] = [];

function createListenerId(prefix: string): string {
    return `${prefix}_${Math.random().toString(36).slice(2)}`;
}

function removeListener<T>(
    arr: ListenerEntry<T>[],
    target: string | T
): boolean {
    const index = arr.findIndex(entry =>
        typeof target === "string"
            ? entry.id === target
            : entry.fn === target
    );

    if (index !== -1) {
        arr.splice(index, 1);
        return true;
    }

    return false;
}

export function debug_render(s: Rendereable, data: any = null) {
    const frozen_to_render =
        s instanceof Sewing
            ? s
            : Array.isArray(s)
                ? s.map(sk => sk.copy())
                : s instanceof Recording
                    ? new Recording(s.snapshots)
                    : s.copy();

    debug_listener.forEach(({ fn }) =>
        fn(frozen_to_render, data)
    );
}

export function hot_debug_render(
    s: Rendereable,
    data: any = null
): Toggle {
    const id = `hot_render_id_${Math.random()}`;

    if (s instanceof Sketch) {
        return wrap_sketch_methods(s, evaluate => {
            const res = evaluate();
            hot_debug_listener.forEach(({ fn }) =>
                fn(s, id, data)
            );
            return res;
        });
    }

    if (Array.isArray(s)) {
        const toggles: Toggle[] = s.map(sk =>
            wrap_sketch_methods(sk, evaluate => {
                const res = evaluate();
                hot_debug_listener.forEach(({ fn }) =>
                    fn(s, id, data)
                );
                return res;
            })
        );

        return (to?: boolean) => {
            if (toggles.length === 0) return true;
            return toggles.map(t => t(to))[0];
        };
    }

    if (s instanceof Recording) {
        return wrap_object_methods(
            s,
            evaluate => {
                const res = evaluate();
                hot_debug_listener.forEach(({ fn }) =>
                    fn(s, id, data)
                );
                return res;
            },
            ["snapshot"]
        );
    }

    return wrap_sewing_methods(s, evaluate => {
        const res = evaluate();
        hot_debug_listener.forEach(({ fn }) =>
            fn(s, id, data)
        );
        return res;
    });
}

export function register_debug_render_listener(
    l: DebugListener
): string {
    const id = createListenerId("debug");
    debug_listener.push({ id, fn: l });
    return id;
}

export function register_hot_debug_render_listener(
    l: HotDebugListener
): string {
    const id = createListenerId("hot_debug");
    hot_debug_listener.push({ id, fn: l });
    return id;
}

export function remove_debug_listener(
    target: string | DebugListener
): boolean {
    return removeListener(debug_listener, target);
}

export function remove_hot_debug_listener(
    target: string | HotDebugListener
): boolean {
    return removeListener(hot_debug_listener, target);
}
