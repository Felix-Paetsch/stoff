import { render_sketches } from "@/Core/Render/render_sketches_methods";
import { Renderer } from "@/Core/Render/renderer";
import { create_design } from "@/Patterns/pattern_export";
import { MeasurementsLayout, PatternConfig } from "@/Patterns/patternTypes";
import { useMemo } from "react";

type SketchesProps = {
    designData: PatternConfig,
    measureData: MeasurementsLayout
}

export function Sketches({
    designData,
    measureData
}: SketchesProps) {
    const build: Renderer | Error = useMemo(() => {
        try {
            const design = create_design(designData, measureData as any);
            const r = new Renderer(design);
            render_sketches(r);
            return r;
        } catch (e) {
            return e instanceof Error ? e : new Error(String(e))
        }
    }, [designData, measureData])

    return (
        <main className="sp__right" aria-label="Preview">
            <div className="sp__rightInner">
                {
                    build instanceof Error ? (
                        <div className="sp__previewError">
                            <div className="sp__previewErrorTitle">
                                {build.name}
                            </div>
                            <pre className="sp__previewErrorStack">
                                {build.stack ?? String(build)}
                            </pre>
                        </div>
                    ) : (
                        <div className="sp__previewList">
                            {build.build_all_sketch_svgs(500, 500, 20).map((item, i) => (
                                <div
                                    className="sp__previewItem"
                                    key={i}
                                >
                                    <div className="sp__previewSvg"
                                        dangerouslySetInnerHTML={{ __html: item }}
                                    />
                                </div>
                            ))}
                        </div>
                    )
                }
            </div>
        </main>
    )
}
