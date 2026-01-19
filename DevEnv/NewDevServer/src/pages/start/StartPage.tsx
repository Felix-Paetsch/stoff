import { useEffect, useMemo, useState } from "react"
import { generatePreviewItems } from "../../lib/svgGenerator"

import "./startPage.css"
import { DEFAULT_DESIGN_CONFIG, DEFAULT_MEASUREMENTS } from "./defaults"
import { LeftSide } from "./components/left"
import { readLS, writeLS } from "./localStorageMap"
import { is_measurements, is_pattern_config, MeasurementsLayout, PatternConfig } from "@/Patterns/patternTypes"
import { Sketches } from "./components/sketches"


export function StartPage() {
    const [leftVisible, setLeftVisible] = useState(() => {
        const raw = readLS("leftVisible")
        return raw === null ? true : raw === "true"
    })

    const [designData, setDesignData] = useState<PatternConfig>(() => {
        const saved = readLS("designDataText");
        try {
            const res = JSON.parse(saved as any);
            if (!is_pattern_config(res)) {
                throw new Error("Make sure this is a valid design config");
            }
            return res;
        } catch (e: any) {
            const err: Error = e;
            console.log(err.message);
            return DEFAULT_DESIGN_CONFIG;
        }
    });

    const [measureData, setMeasureData] = useState<MeasurementsLayout>(() => {
        const saved = readLS("measureDataText");
        try {
            const res = JSON.parse(saved as any);
            if (!is_measurements(res)) {
                throw new Error("Make sure this is a valid design config");
            }
            return res;
        } catch (e: any) {
            const err: Error = e;
            console.log(err.message);

            return DEFAULT_MEASUREMENTS;
        }
    });

    useEffect(() => writeLS("designDataText", JSON.stringify(designData)), [designData])
    useEffect(() => writeLS("measureDataText", JSON.stringify(measureData)), [measureData])

    function onToggleLeft() {
        setLeftVisible((v) => {
            const next = !v
            writeLS("leftVisible", String(next))
            return next
        })
    }

    const preview = useMemo(() => {
        try {
            return {
                ok: true as const,
                items: generatePreviewItems(designData, measureData),
            }
        } catch (e) {
            const err = e instanceof Error ? e : new Error(String(e))
            return { ok: false as const, error: err }
        }
    }, [designData, measureData])

    return (
        <div className="sp">
            <button
                className="sp__topbar"
                type="button"
                onClick={onToggleLeft}
            >
                StoffStoff2
            </button>

            <div className="sp__main">
                {leftVisible ? <LeftSide
                    designData={designData}
                    setDesignData={setDesignData}
                    measureData={measureData}
                    setMeasureData={setMeasureData}
                /> : null}

                <Sketches
                    designData={designData}
                    measureData={measureData}
                />
            </div>
        </div>
    )
}
