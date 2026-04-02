import { create_design } from "@/Patterns/patterns";
import { is_pattern_config_with_pattern_name } from "./is_pattern_config";
import {
    register_debug_render_listener,
    register_hot_debug_render_listener,
    remove_debug_listener,
    remove_hot_debug_listener,
    Rendereable,
} from "@/Core/Debug/debug_render";
import {
    clearStackTraceSourceMapCache,
    mapStackTrace,
} from "../utils/correctErrorStackTrace";
import {
    is_global_recording,
    stop_global_recording,
} from "@/Core/Debug/recording";

export type DesignRenderResult = ReturnType<typeof create_design>;
export type DebugRenderData = {
    data: any;
    to_render: Rendereable;
    stack: Promise<string>;
    hot: boolean;
    id?: string;
}[];

export function create_design_data(designConfig: any): {
    design: DesignRenderResult;
    debug: DebugRenderData;
} {
    clearStackTraceSourceMapCache();

    const is_config = is_pattern_config_with_pattern_name(designConfig);

    if (typeof is_config === "string") {
        return {
            design: new Error(is_config),
            debug: [],
        };
    }

    const debug: DebugRenderData = [];

    const lis_id = register_debug_render_listener((s, data) => {
        debug.push({
            data: data,
            to_render: s,
            hot: false,
            stack: mapStackTrace(new Error()),
        });
    });

    const hot_lis_id = register_hot_debug_render_listener((s, id, data) => {
        const entry = debug.find((e) => e.id == id);

        if (!entry) {
            debug.push({
                data: data,
                to_render: s,
                hot: true,
                id,
                stack: mapStackTrace(new Error()),
            });
        } else {
            entry.stack = mapStackTrace(new Error());
        }
    });

    const design = create_design(designConfig.pattern_name, designConfig);

    remove_debug_listener(lis_id);
    remove_hot_debug_listener(hot_lis_id);

    if (is_global_recording()) {
        stop_global_recording();
    }

    return {
        design,
        debug,
    };
}
