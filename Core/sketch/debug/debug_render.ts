import {
    Toggle,
    wrap_object_methods,
} from "../../utils/prototype_modification";
import { Sketch } from "../sketch";
import { Recording } from "./recording";
import { wrap_sketch_methods } from "../sketch/wrap_sketch_methods";

export type Rendereable = Sketch | Sketch[] | Recording;
export type DebugListener = (s: Rendereable, data: any) => void;
export type HotDebugListener = (s: Rendereable, id: string, data: any) => void;

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
    target: string | T,
): boolean {
    const index = arr.findIndex((entry) =>
        typeof target === "string" ? entry.id === target : entry.fn === target,
    );

    if (index !== -1) {
        arr.splice(index, 1);
        return true;
    }

    return false;
}

export function debug_render(s: Rendereable, data: any = null) {
    const frozen_to_render = Array.isArray(s)
        ? s.map((sk) => sk.copy().sketch)
        : s instanceof Recording
          ? new Recording(s.snapshots)
          : s.copy().sketch;

    debug_listener.forEach(({ fn }) => fn(frozen_to_render, data));
}

export function hot_debug_render(s: Rendereable, data: any = null): Toggle {
    const id = `hot_render_id_${Math.random()}`;

    if (s instanceof Sketch) {
        return wrap_sketch_methods(s, (evaluate) => {
            const res = evaluate();
            hot_debug_listener.forEach(({ fn }) => fn(s, id, data));
            return res;
        });
    }

    if (Array.isArray(s)) {
        const toggles: Toggle[] = s.map((sk) =>
            wrap_sketch_methods(sk, (evaluate) => {
                const res = evaluate();
                hot_debug_listener.forEach(({ fn }) => fn(s, id, data));
                return res;
            }),
        );

        let toggle_state: boolean = true;

        return (to?: boolean) => {
            if (toggles.length === 0) return true;
            toggle_state = typeof to == "boolean" ? to : !toggle_state;
            toggles.forEach((t) => t(toggle_state));
            return toggle_state;
        };
    }

    return wrap_object_methods(
        s,
        (evaluate) => {
            const res = evaluate();
            hot_debug_listener.forEach(({ fn }) => fn(s, id, data));
            return res;
        },
        ["snapshot"],
    );
}

export function register_debug_render_listener(l: DebugListener): string {
    const id = createListenerId("debug");
    debug_listener.push({ id, fn: l });
    return id;
}

export function register_hot_debug_render_listener(
    l: HotDebugListener,
): string {
    const id = createListenerId("hot_debug");
    hot_debug_listener.push({ id, fn: l });
    return id;
}

export function remove_debug_listener(target: string | DebugListener): boolean {
    return removeListener(debug_listener, target);
}

export function remove_hot_debug_listener(
    target: string | HotDebugListener,
): boolean {
    return removeListener(hot_debug_listener, target);
}
