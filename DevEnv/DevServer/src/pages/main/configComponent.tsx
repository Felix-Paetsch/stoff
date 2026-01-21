import { useEffect, useState } from "react"
import { DesignInputData } from "src/App";
import { is_pattern_config_with_pattern_name } from "../../lib/is_pattern_config";
import { copyToClipboard } from "../../utils/copy";
import { JsonCodeEditor } from "./JsonCodeEditor/JsonCodeEditor.tsx";
import { DEFAULT_DESIGN_CONFIG, DEFAULT_MEASUREMENTS } from "../../config/defaults.ts";

type LeftSideProps = {
    designInputData: DesignInputData
}

export function ConfigComponent({
    designInputData
}: LeftSideProps) {
    const [designText, setDesignText] = useState(JSON.stringify(designInputData.designData, null, 2));
    const [measureText, setMeasureText] = useState(JSON.stringify(designInputData.measureData, null, 2));

    const [designError, setDesignError] = useState<string | null>(null)
    const [measureError, setMeasureError] = useState<string | null>(null)

    const [copied, setCopied] = useState<null | "design" | "measure">(null)

    useEffect(() => {
        let potentialDesignConfig: any = {};
        try {
            potentialDesignConfig = JSON.parse(designText);
        } catch {
            setDesignError("Invalid JSON");
            return;
        }

        const is_config: string | true = is_pattern_config_with_pattern_name(potentialDesignConfig);

        if (typeof is_config == "string") {
            setDesignError(is_config);
            return;
        }

        setDesignError(null);
        designInputData.setDesignData(potentialDesignConfig);
    }, [designText]);

    useEffect(() => {
        let potentialMeasureConfig: any = {};
        try {
            potentialMeasureConfig = JSON.parse(measureText);
        } catch {
            setMeasureError("Invalid JSON");
            return;
        }

        setMeasureError(null);
        designInputData.setMeasureData(potentialMeasureConfig);
    }, [measureText])

    function handleCopy(kind: "design" | "measure", text: string) {
        copyToClipboard(text).then(() => {
            setCopied(kind)
            setTimeout(() => setCopied(null), 1500)
        })
    }

    return (
        <aside className="shd__left" aria-label="Inputs">
            <div className="shd__leftInner">

                <JsonCodeEditor
                    title="Design Config"
                    initial_value={designText}
                    onBlur={setDesignText}
                    error={designError}
                />

                <JsonCodeEditor
                    title="Measurements"
                    initial_value={measureText}
                    onBlur={setMeasureText}
                    error={measureError}
                />

                <section className="shd__defaults">

                    <div className="shd__defaultsHeader">

                        Defaults
                    </div>

                    <div className="shd__defaultBlock">

                        <div className="shd__defaultTitleRow">

                            <div className="shd__defaultTitle">

                                Design Config
                            </div>
                            <button
                                className="shd__copyBtn"

                                type="button"
                                onClick={() => {
                                    setDesignError(null)
                                    handleCopy(
                                        "design",
                                        JSON.stringify(DEFAULT_DESIGN_CONFIG, null, 2)
                                    )
                                }}
                            >
                                {copied === "design"
                                    ? "Copied ✅"
                                    : "Copy"}
                            </button>
                        </div>
                        <pre className="shd__defaultPre">

                            {JSON.stringify(DEFAULT_DESIGN_CONFIG, null, 2)}
                        </pre>
                    </div>

                    <div className="shd__defaultBlock">

                        <div className="shd__defaultTitleRow">

                            <div className="shd__defaultTitle">

                                Measurements
                            </div>
                            <button
                                className="shd__copyBtn"

                                type="button"
                                onClick={() => {
                                    setMeasureError(null)
                                    handleCopy(
                                        "measure",
                                        JSON.stringify(DEFAULT_MEASUREMENTS, null, 2)
                                    )
                                }}
                            >
                                {copied === "measure"
                                    ? "Copied ✅"
                                    : "Copy"}
                            </button>
                        </div>
                        <pre className="shd__defaultPre">

                            {JSON.stringify(DEFAULT_MEASUREMENTS, null, 2)}
                        </pre>
                    </div>
                </section>
            </div>
        </aside>
    )
}
