import { render_sketches } from "@/Core/Render/render_sketches_methods";
import { Renderer } from "@/Core/Render/renderer";
import { create_design, PatternConfig } from "@/Patterns/patterns";
import { add_svg_hover_events, cleanup_svg_hover_events } from "../../../lib/add_hover_events";
import { deleteStackTraceFromFirstTSX, mapStackTrace } from "../../../lib/correctErrorStackTrace";
import { useEffect, useState } from "react";

type SketchesProps = {
    designData: PatternConfig;
    measureData: any;
};

export function Sketches({ designData, measureData }: SketchesProps) {
    const [mappedStack, setMappedStack] = useState<string | null>(null);

    const build = (() => {
        try {
            const name: string = (designData as any).pattern_name;
            const design = create_design(name, designData, measureData);

            if (design instanceof Error) {
                return design;
            }

            if (design.success !== false) {
                const r = new Renderer(design.result);
                render_sketches(r);

                return {
                    renderer: r,
                    data: design.data || null,
                };
            }

            return new Error(design.reason || "Unspecified error creating design");
        } catch (e) {
            return e instanceof Error ? e : new Error(String(e));
        }
    })();

    useEffect(() => {
        let cancelled = false;

        if (!(build instanceof Error)) {
            setMappedStack(null);
            return;
        }

        (async () => {
            const mapped = await mapStackTrace(build); // , { debug: false });

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
    }, [build]);

    useEffect(() => {
        if (build instanceof Error) return;

        requestAnimationFrame(() => {
            add_svg_hover_events();
        });

        return () => {
            cleanup_svg_hover_events();
        };
    }, [build]);

    return (
        <main className="sp__right" aria-label="Preview">
            <div className="sp__rightInner">
                {build instanceof Error ? (
                    <div className="sp__previewError">
                        <div className="sp__previewErrorTitle">
                            {build.name}: {build.message}
                        </div>
                        <pre className="sp__previewErrorStack">
                            {mappedStack ?? "Stack Trace Loading.."}
                        </pre>
                    </div>
                ) : (
                    <div className="sp__previewList sketch_display">
                        {build.renderer.build_all_sketch_svgs(500, 500, 20).map((item, i) => (
                            <div className="sp__previewItem" key={i}>
                                <div
                                    className="sp__previewSvg"
                                    dangerouslySetInnerHTML={{ __html: item }}
                                />
                            </div>
                        ))}

                        <div className="sp__previewItem">
                            <pre>{build.data}</pre>
                        </div>
                    </div>
                )}
            </div>
        </main>
    );
}
