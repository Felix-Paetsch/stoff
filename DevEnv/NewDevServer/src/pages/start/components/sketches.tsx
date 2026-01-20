import { render_sketches } from "@/Core/Render/render_sketches_methods";
import { Renderer } from "@/Core/Render/renderer";
import { create_design, PatternConfig } from "@/Patterns/patterns";
import { useEffect, useMemo, useRef, useState } from "react";
import { add_svg_hover_events, cleanup_svg_hover_events } from "./hover";
import { mapStackTrace } from "../../../lib/correctErrorStackTrace";

type SketchesProps = {
    designData: PatternConfig;
    measureData: any;
};

export function Sketches({ designData, measureData }: SketchesProps) {
    const containerRef = useRef<HTMLDivElement | null>(null);
    const [mappedStack, setMappedStack] = useState<string | null>(null);

    const build = useMemo(() => {
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
    }, [designData, measureData]);

    // Compute mapped stack asynchronously (can't do this during render)
    useEffect(() => {
        let cancelled = false;

        if (!(build instanceof Error)) {
            setMappedStack(null);
            return;
        }

        (async () => {
            const mapped = await mapStackTrace(build); // , { debug: false });

            if (!cancelled) setMappedStack(mapped);
        })().catch(() => {
            if (!cancelled) setMappedStack(build.stack ?? String(build));
        });

        return () => {
            cancelled = true;
        };
    }, [build]);

    useEffect(() => {
        if (build instanceof Error) return;
        if (!containerRef.current) return;

        requestAnimationFrame(() => {
            add_svg_hover_events(containerRef.current!);
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
                    <div ref={containerRef} className="sp__previewList sketch_display">
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
