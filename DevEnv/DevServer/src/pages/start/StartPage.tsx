import "./startPage.css"
import { DEFAULT_DESIGN_CONFIG, DEFAULT_MEASUREMENTS } from "./defaults"
import { LeftSide } from "./components/left"
import { readLS, writeLS } from "./localStorageMap"
import { Sketches } from "./components/sketches"
import { is_pattern_config, PatternConfig } from "@/Patterns/patterns"
import { useEffect, useState } from "react"


export function StartPage() {
    const [leftVisible, setLeftVisible] = useState(() => {
        const raw = readLS("leftVisible")
        return raw === null ? true : raw === "true"
    })

    const [designData, setDesignData] = useState<PatternConfig>(() => {
        const saved = readLS("designDataText");
        try {
            const res = JSON.parse(saved as any);
            let is_config: string | true;
            try {
                is_config = is_pattern_config(res.pattern_name, res);
            } catch {
                throw new Error(`You need to specify an object with the "pattern_name" key.`);
            }
            if (typeof is_config == "string") {
                throw new Error(is_config);
            }
            return res;
        } catch (e: any) {
            const err: Error = e;
            console.log(err.message);
            return DEFAULT_DESIGN_CONFIG;
        }
    });

    const [measureData, setMeasureData] = useState(() => {
        const saved = readLS("measureDataText");
        try {
            const res = JSON.parse(saved as any);
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
