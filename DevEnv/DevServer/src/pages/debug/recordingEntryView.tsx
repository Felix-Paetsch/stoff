import { Recording } from "@/Core/Debug/recording"
import { render_sketches } from "@/Core/Render/render_sketches_methods"
import { Renderer } from "@/Core/Render/renderer"
import { useMemo, useState } from "react"
import { DebugRenderData } from "../../lib/create_design_data"

type RecordingEntry = DebugRenderData[number] & {
    to_render: Recording
}

export function RecordingEntryView({
    entry,
    index,
}: {
    entry: RecordingEntry
    index: number
}) {
    const [page, setPage] = useState(
        entry.to_render.snapshots.length
    )

    const renders = useMemo(() => {
        return entry.to_render.snapshots.map(snapshot => {
            const renderer = new Renderer(snapshot);
            render_sketches(renderer);

            return renderer.build_all_sketch_svgs(500, 500, 20)
        })
    }, [entry.to_render])

    let render_data: string | null = null
    if (entry.data) {
        try {
            render_data = JSON.stringify(entry.data, null, 2)
        } catch {
            render_data = "Failed to serialize data!"
        }
    }

    const originaĺ_traces: string[] = (entry.to_render as any).stack_traces;
    const traces = originaĺ_traces.map(t => {
        return t.split("\n").map(l => l.split("?")[0]).join("\n") + "\n[Sadly I can't provide you with the correct line numbers here..]";
    })

    return (
        <section
            key={index}
            className={
                "dbg__entryRow" +
                (entry.hot ? " dbg__entryRow--hot" : "")
            }
        >
            <input
                type="number"
                min={1}
                max={renders.length}
                value={page}
                onChange={e =>
                    setPage(Number(e.target.value))
                }
            />

            {renders.map((rendered, render_index) => (
                <div
                    key={render_index}
                    className="shd__previewList dbg__previewList sketch_display"
                    style={{
                        display:
                            page === render_index + 1
                                ? "block"
                                : "none",
                    }}
                >
                    {rendered.map((item, i) => (
                        <div
                            className="shd__previewItem"
                            key={"_" + render_index + i}
                        >
                            <div
                                className="shd__previewSvg"
                                dangerouslySetInnerHTML={{
                                    __html: item,
                                }}
                            />
                        </div>
                    ))}

                    {
                        render_data && (
                            <div className="shd__previewItem">
                                <pre>{render_data}</pre>
                            </div>
                        )
                    }

                    <div className="shd__previewItem">
                        <pre>{traces[render_index] || "No stack found."}</pre>
                    </div>

                </div>
            ))}
        </section>
    )
}
