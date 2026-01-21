import { Renderer } from "@/Core/Render/renderer";
import { useEffect, useState } from "react";
import { deleteStackTraceFromFirstTSX, mapStackTrace } from "../../utils/correctErrorStackTrace";
import { render_sketches } from "@/Core/Render/render_sketches_methods";
import { DesignRenderResult } from "../../lib/create_design_data";

type SketchesProps = {
    design: DesignRenderResult;
};

export function SketchesComponent({ design }: SketchesProps) {
    const [mappedStack, setMappedStack] = useState<string | null>(null);

    useEffect(() => {
        let cancelled = false;

        if (!(design instanceof Error)) {
            setMappedStack(null);
            return;
        }

        (async () => {
            const mapped = await mapStackTrace(design); // , { debug: false });

            if (cancelled) return;

            const deletedTrace = deleteStackTraceFromFirstTSX(mapped);
            const mappedTrace = deletedTrace.split("\n").map(
                l => l.split("@")
            ).map(
                l => {
                    return `${l[0]!}@${l[2]!}`
                }
            ).join("\n");

            setMappedStack(mappedTrace);
        })().catch(() => {
            if (!cancelled) setMappedStack("Failed to Load Stack Trace");
        });

        return () => {
            cancelled = true;
        };
    }, [design]);

    let processedResult: Error | {
        renderer: Renderer,
        data: any
    };

    if (design instanceof Error) {
        processedResult = design;
    } else if (design.success === false) {
        processedResult = new Error(design.reason)
    } else {
        processedResult = {
            renderer: new Renderer(design.result),
            data: null
        }

        render_sketches(processedResult.renderer);

        if (design.data) {
            try {
                processedResult.data = JSON.stringify(design.data, null, 2);
            } catch {
                processedResult.data = "Failed to serialize data!"
            }
        }
    }

    return (
        <main className="shd__right" aria-label="Preview">
            <div className="shd__rightInner">

                {processedResult instanceof Error ? (
                    <div className="shd__previewError">
                        <div className="shd__previewErrorTitle">

                            {processedResult.name}: {processedResult.message}
                        </div>
                        <pre className="shd__previewErrorStack">

                            {mappedStack ?? "Stack Trace Loading.."}
                        </pre>
                    </div>
                ) : (
                    <div className="shd__previewList sketch_display">

                        {processedResult.renderer.build_all_sketch_svgs(500, 500, 20).map((item, i) => (
                            <div className="shd__previewItem" key={i}>
                                <div
                                    className="shd__previewSvg"

                                    dangerouslySetInnerHTML={{ __html: item }}
                                />
                            </div>
                        ))}

                        <div className="shd__previewItem shd__previewItem--text">

                            <pre>{processedResult.data}</pre>
                        </div>

                    </div>
                )}
            </div>
        </main>
    );
}
