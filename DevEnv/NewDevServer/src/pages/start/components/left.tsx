import { useEffect, useState } from "react"
import { JsonCodeEditor } from "../../../components/JsonCodeEditor/JsonCodeEditor";
import { copyToClipboard } from "../../../lib/copy"
import { DEFAULT_DESIGN_CONFIG, DEFAULT_MEASUREMENTS } from "../defaults"
import { is_pattern_config, PatternConfig } from "@/Patterns/patterns";

type LeftSideProps = {
    designData: PatternConfig
    setDesignData: React.Dispatch<React.SetStateAction<PatternConfig>>

    measureData: any, setMeasureData: React.Dispatch<React.SetStateAction<any>>
}

export function LeftSide({
    designData,
    setDesignData,
    measureData,
    setMeasureData,
}: LeftSideProps) {
    const [designText, setDesignText] = useState(JSON.stringify(designData, null, 2));
    const [measureText, setMeasureText] = useState(JSON.stringify(measureData, null, 2));

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

        let is_config: string | true;
        try {
            is_config = is_pattern_config(potentialDesignConfig.pattern_name, potentialDesignConfig);
        } catch {
            setDesignError(`You need to specify an object with the "pattern_name" key.`);
            return;
        }

        if (typeof is_config == "string") {
            setDesignError(is_config);
            return;
        }

        setDesignError(null);
        setDesignData(potentialDesignConfig);
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
        setMeasureData(potentialMeasureConfig);
    }, [measureText])

    function handleCopy(kind: "design" | "measure", text: string) {
        copyToClipboard(text).then(() => {
            setCopied(kind)
            setTimeout(() => setCopied(null), 1500)
        })
    }

    return (
        <aside className="sp__left" aria-label="Inputs">
            <div className="sp__leftInner">
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

                <section className="sp__defaults">
                    <div className="sp__defaultsHeader">
                        Defaults
                    </div>

                    <div className="sp__defaultBlock">
                        <div className="sp__defaultTitleRow">
                            <div className="sp__defaultTitle">
                                Design Config
                            </div>
                            <button
                                className="sp__copyBtn"
                                type="button"
                                onClick={() => {
                                    setDesignText(
                                        JSON.stringify(DEFAULT_DESIGN_CONFIG, null, 2)
                                    )
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
                        <pre className="sp__defaultPre">
                            {JSON.stringify(DEFAULT_DESIGN_CONFIG, null, 2)}
                        </pre>
                    </div>

                    <div className="sp__defaultBlock">
                        <div className="sp__defaultTitleRow">
                            <div className="sp__defaultTitle">
                                Measurements
                            </div>
                            <button
                                className="sp__copyBtn"
                                type="button"
                                onClick={() => {
                                    setMeasureText(
                                        JSON.stringify(DEFAULT_MEASUREMENTS, null, 2)
                                    )
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
                        <pre className="sp__defaultPre">
                            {JSON.stringify(DEFAULT_MEASUREMENTS, null, 2)}
                        </pre>
                    </div>
                </section>
            </div>
        </aside>
    )
}
