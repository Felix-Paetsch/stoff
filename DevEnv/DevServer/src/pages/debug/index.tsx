import { Recording } from "@/Core/Debug/recording"
import { render_sketches } from "@/Core/Render/render_sketches_methods"
import { Renderer } from "@/Core/Render/renderer"
import { Sewing } from "@/Core/Sewing/sewing"
import { Sketch } from "@/Core/StoffLib/sketch"
import { DebugRenderData } from "src/lib/create_design_data"
import { en } from "zod/v4/locales"

type DebugPageProps = {
    debugRenderData: DebugRenderData
}

export function DebugPage({ debugRenderData }: DebugPageProps) {
    return (
        <div className="sp__debug">
            <div className="sp__debugInner">
                {debugRenderData.map(entry => {
                    if (!(entry.to_render instanceof Recording)) {
                        return render_non_recording(entry)
                    }

                    throw new Error("Currently unsupported to render recording")
                })}
            </div>
        </div>
    )
}

function render_non_recording(entry: Exclude<DebugRenderData[number], { to_render: Recording }>) {
    let sewing: Sewing;
    if (entry.to_render instanceof Sketch) {
        sewing = new Sewing([entry.to_render]);
    } else if (Array.isArray(entry.to_render)) {
        sewing = new Sewing(entry.to_render);
    } else {
        sewing = entry.to_render as Sewing;
    }

    const renderer = new Renderer(sewing);
    render_sketches(renderer);

    let render_data: any = null;
    if (entry.data) {
        try {
            render_data = JSON.stringify(entry.data, null, 2);
        } catch {
            render_data = "Failed to serialize data!"
        }
    }

    return (
        <div
            className={`sp__previewList sketch_display debug_render_section_${entry.hot}`}
        >
            {renderer.build_all_sketch_svgs(500, 500, 20).map((item, i) => (
                <div className="sp__previewItem" key={i}>
                    <div
                        className="sp__previewSvg"
                        dangerouslySetInnerHTML={{ __html: item }}
                    />
                </div>
            ))}

            <div className="sp__previewItem">
                <pre>{render_data}</pre>
            </div>
        </div>
    )
}
