import { render_sketches } from "@/Core/Render/render_sketches_methods";
import { Renderer } from "@/Core/Render/renderer";
import { create_design, PatternConfig } from "@/Patterns/patterns";
import { useMemo } from "react";

type SketchesProps = {
    designData: PatternConfig,
    measureData: any
}

export function Sketches({
    designData,
    measureData
}: SketchesProps) {
    const build = useMemo(() => {
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
                data: design.data || null
            };
        }

        return new Error(design.reason || "Unspecified error creating design");
    }, [designData, measureData])

    return (
        <main className="sp__right" aria-label="Preview">
            <div className="sp__rightInner">
                {
                    build instanceof Error ? (
                        <div className="sp__previewError">
                            <div className="sp__previewErrorTitle">
                                {build.name}: {build.message}
                            </div>
                            <pre className="sp__previewErrorStack">
                                {build.stack ?? String(build)}
                            </pre>
                        </div>
                    ) : (
                        <div className="sp__previewList">
                            {build.renderer.build_all_sketch_svgs(500, 500, 20).map((item, i) => (
                                <div
                                    className="sp__previewItem"
                                    key={i}
                                >
                                    <div className="sp__previewSvg"
                                        dangerouslySetInnerHTML={{ __html: item }}
                                    />
                                </div>
                            ))}

                            <div
                                className="sp__previewItem"
                            >
                                <pre>
                                    {build.data}
                                </ pre>
                            </div>
                        </div>
                    )
                }
            </div>
        </main>
    )
}
