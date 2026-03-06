import { useEffect, useMemo, useState } from "react";
import { DesignInputData } from "src/App";
import { is_pattern_config_with_pattern_name } from "../../lib/is_pattern_config";
import { copyToClipboard } from "../../utils/copy";
import { JsonCodeEditor } from "./JsonCodeEditor/JsonCodeEditor.tsx";
import {
    DEFAULT_DESIGN_CONFIG,
    DEFAULT_MEASUREMENTS,
} from "../../config/defaults.ts";

type LeftSideProps = {
    designInputData: DesignInputData;
};

export function ConfigComponent({ designInputData }: LeftSideProps) {
    const [designText, setDesignText] = useState(
        JSON.stringify(designInputData.designData, null, 2),
    );
    const [measureText, setMeasureText] = useState(
        JSON.stringify(designInputData.measureData, null, 2),
    );

    const [copied, setCopied] = useState<null | "design" | "measure">(null);

    const designParse = useMemo(() => {
        try {
            const parsed = JSON.parse(designText);
            const isConfig = is_pattern_config_with_pattern_name(parsed);

            if (typeof isConfig === "string") {
                return { error: isConfig, data: null };
            }

            return { error: null, data: parsed };
        } catch {
            return { error: "Invalid JSON", data: null };
        }
    }, [designText]);

    const measureParse = useMemo(() => {
        try {
            return { error: null, data: JSON.parse(measureText) };
        } catch {
            return { error: "Invalid JSON", data: null };
        }
    }, [measureText]);

    useEffect(() => {
        if (designParse.data) {
            designInputData.setDesignData(designParse.data);
        }
    }, [designParse.data, designInputData]);

    useEffect(() => {
        if (measureParse.data) {
            designInputData.setMeasureData(measureParse.data);
        }
    }, [measureParse.data, designInputData]);

    function handleCopy(kind: "design" | "measure", text: string) {
        copyToClipboard(text).then(() => {
            setCopied(kind);
            setTimeout(() => setCopied(null), 1500);
        });
    }

    return (
        <aside className="shd__left" aria-label="Inputs">
            <div className="shd__leftInner">
                <JsonCodeEditor
                    title="Design Config"
                    initial_value={designText}
                    onBlur={setDesignText}
                    error={designParse.error}
                />

                <JsonCodeEditor
                    title="Measurements"
                    initial_value={measureText}
                    onBlur={setMeasureText}
                    error={measureParse.error}
                />

                <section className="shd__defaults">
                    <div className="shd__defaultsHeader">Defaults</div>

                    <div className="shd__defaultBlock">
                        <div className="shd__defaultTitleRow">
                            <div className="shd__defaultTitle">Design Config</div>
                            <button
                                className="shd__copyBtn"
                                type="button"
                                onClick={() => {
                                    handleCopy(
                                        "design",
                                        JSON.stringify(DEFAULT_DESIGN_CONFIG, null, 2),
                                    );
                                }}
                            >
                                {copied === "design" ? "Copied ✅" : "Copy"}
                            </button>
                        </div>

                        <pre className="shd__defaultPre">
                            {JSON.stringify(DEFAULT_DESIGN_CONFIG, null, 2)}
                        </pre>
                    </div>

                    <div className="shd__defaultBlock">
                        <div className="shd__defaultTitleRow">
                            <div className="shd__defaultTitle">Measurements</div>
                            <button
                                className="shd__copyBtn"
                                type="button"
                                onClick={() => {
                                    handleCopy(
                                        "measure",
                                        JSON.stringify(DEFAULT_MEASUREMENTS, null, 2),
                                    );
                                }}
                            >
                                {copied === "measure" ? "Copied ✅" : "Copy"}
                            </button>
                        </div>

                        <pre className="shd__defaultPre">
                            {JSON.stringify(DEFAULT_MEASUREMENTS, null, 2)}
                        </pre>
                    </div>
                </section>
            </div>
        </aside>
    );
}
