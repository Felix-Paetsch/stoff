import { create_design } from "@/Patterns/patterns";
import { is_pattern_config_with_pattern_name } from "./is_pattern_config";
import { register_debug_render_listener, register_hot_debug_render_listener, remove_debug_listener, remove_hot_debug_listener, Rendereable } from "@/Core/Debug/debug_render";

export type DesignRenderResult = ReturnType<typeof create_design>;
export type DebugRenderData = ({
    data: any,
    to_render: Rendereable,
    hot: boolean
})[];

export function create_design_data(designConfig: any, mea: any): {
    design: DesignRenderResult,
    debug: DebugRenderData
} {
    const is_config = is_pattern_config_with_pattern_name(
        designConfig
    )

    if (typeof is_config === "string") {
        return {
            design: new Error(is_config),
            debug: []
        }
    }

    const debug: DebugRenderData = [];

    const lis_id = register_debug_render_listener((s, data) => {
        debug.push({
            data: data,
            to_render: s,
            hot: false
        })
    });

    const seen_ids: string[] = [];
    const hot_lis_id = register_hot_debug_render_listener((s, data, id) => {
        if (seen_ids.includes(id)) {
            return;
        }

        debug.push({
            data: data,
            to_render: s,
            hot: true
        });

        seen_ids.push(id);
    });

    const design = create_design(designConfig.pattern_name, designConfig, mea);

    remove_debug_listener(lis_id);
    remove_hot_debug_listener(hot_lis_id);

    return {
        design,
        debug
    }
}
