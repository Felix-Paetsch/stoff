import { useEffect, useMemo, useState } from "react";

import { Recording } from "@/Core/Debug/recording";
import { render_sketches } from "@/Core/Render/render_sketches_methods";
import { Renderer } from "@/Core/Render/renderer";

import { DebugRenderData } from "../../lib/create_design_data";
import {
    deleteStackTraceFromFirstTSX,
    mapStackTrace,
} from "../../utils/correctErrorStackTrace";

type RecordingEntry = DebugRenderData[number] & {
    to_render: Recording;
};

export function RecordingEntryView({
    entry,
    index,
}: {
    entry: RecordingEntry;
    index: number;
}) {
    const [page, setPage] = useState(entry.to_render.snapshots.length);
    const [traces, setTraces] = useState<string[]>(() =>
        entry.to_render.snapshots.map(() => "Loading stack..."),
    );

    const renders = useMemo(() => {
        return entry.to_render.snapshots.map((snapshot) => {
            const renderer = new Renderer(snapshot.object);
            render_sketches(renderer);

            return renderer.build_all_sketch_svgs(500, 500, 20);
        });
    }, [entry.to_render]);

    useEffect(() => {
        let cancelled = false;

        Promise.all(
            entry.to_render.snapshots.map(async (snapshot) => {
                try {
                    const mapped = await mapStackTrace(
                        snapshot.stackTrace,
                        {
                            debug: false,
                        },
                    );

                    return deleteStackTraceFromFirstTSX(mapped)
                        .split("\n")
                        .slice(1)
                        .join("\n");
                } catch {
                    return "Failed loading stack...";
                }
            }),
        )
            .then((resolvedTraces) => {
                if (!cancelled) {
                    setTraces(resolvedTraces);
                }
            })
            .catch(() => {
                if (!cancelled) {
                    setTraces(
                        entry.to_render.snapshots.map(
                            () => "Failed loading stack...",
                        ),
                    );
                }
            });

        return () => {
            cancelled = true;
        };
    }, [entry.to_render]);

    let renderData: string | null = null;
    if (entry.data) {
        try {
            renderData = JSON.stringify(entry.data, null, 2);
        } catch {
            renderData = "Failed to serialize data!";
        }
    }

    const total = renders.length;
    const effectivePage =
        total === 0 ? 0 : Math.min(Math.max(page || 1, 1), total);

    return (
        <section
            key={index}
            className={
                "dbg__entryRow" + (entry.hot ? " dbg__entryRow--hot" : "")
            }
        >
            <div className="dbg__recordingControls">
                <input
                    className="dbg__recordingSlider"
                    type="range"
                    min={1}
                    max={Math.max(total, 1)}
                    step={1}
                    value={Math.max(effectivePage, 1)}
                    disabled={total === 0}
                    onChange={(e) => setPage(Number(e.target.value))}
                />

                <div className="dbg__recordingCounter">
                    {total === 0 ? "0/0" : `${effectivePage}/${total}`}
                </div>
            </div>

            {renders.map((rendered, renderIndex) => (
                <div
                    key={renderIndex}
                    className="shd__previewList dbg__previewList sketch_display"
                    style={{
                        display:
                            effectivePage === renderIndex + 1
                                ? "flex"
                                : "none",
                    }}
                >
                    {rendered.map((item, i) => (
                        <div
                            className="shd__previewItem"
                            key={`_${renderIndex}${i}`}
                        >
                            <div
                                className="shd__previewSvg"
                                dangerouslySetInnerHTML={{
                                    __html: item,
                                }}
                            />
                        </div>
                    ))}

                    {renderData && (
                        <div className="shd__previewItem">
                            <pre>{renderData}</pre>
                        </div>
                    )}

                    <div className="shd__previewItem">
                        <pre>{traces[renderIndex] || "No stack found."}</pre>
                    </div>
                </div>
            ))}
        </section>
    );
}


