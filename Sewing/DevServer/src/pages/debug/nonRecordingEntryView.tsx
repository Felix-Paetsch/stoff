import { useEffect, useState } from "react"

import { Recording } from "@/Core/Debug/recording"
import { render_sketches } from "@/Core/Render/render_sketches_methods"
import { Renderer } from "@/Core/Render/renderer"
import { Sewing } from "@/Core/Sewing/sewing"
import { Sketch } from "@/Core/StoffLib/sketch"

import { DebugRenderData } from "../../lib/create_design_data"
import { deleteStackTraceFromFirstTSX } from "../../utils/correctErrorStackTrace"

export type NonRecordingEntryProps = {
    entry: Exclude<
        DebugRenderData[number],
        { to_render: Recording }
    >
    index: number
}

export function NonRecordingEntryView({
    entry,
    index,
}: NonRecordingEntryProps) {
    let sewing: Sewing

    if (entry.to_render instanceof Sketch) {
        sewing = new Sewing([entry.to_render])
    } else if (Array.isArray(entry.to_render)) {
        sewing = new Sewing(entry.to_render)
    } else {
        sewing = entry.to_render as Sewing
    }

    const renderer = new Renderer(sewing)
    render_sketches(renderer)

    const [stackText, setStackText] = useState<string>(
        "Loading stack..."
    )

    useEffect(() => {
        let cancelled = false

        Promise.resolve(entry.stack)
            .then(stack => {
                if (!cancelled) {
                    setStackText(
                        deleteStackTraceFromFirstTSX(stack).split("\n").slice(3).join("\n")
                    )
                }
            })
            .catch(() => {
                if (!cancelled) {
                    setStackText(
                        "Failed loading stack...",
                    )
                }
            })

        return () => {
            cancelled = true
        }
    }, [entry.stack])

    let render_data: string | null = null
    if (entry.data) {
        try {
            render_data = JSON.stringify(entry.data, null, 2)
        } catch {
            render_data = "Failed to serialize data!"
        }
    }

    return (
        <section
            key={index}
            className={
                "dbg__entryRow" +
                (entry.hot ? " dbg__entryRow--hot" : "")
            }
        >
            <div className="shd__previewList dbg__previewList sketch_display">
                {renderer
                    .build_all_sketch_svgs(500, 500, 20)
                    .map((item, i) => (
                        <div
                            className="shd__previewItem"
                            key={i}
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
                    <pre>{stackText}</pre>
                </div>
            </div>
        </section>
    )
}
