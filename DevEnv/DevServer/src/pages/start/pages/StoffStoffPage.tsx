import { useEffect, useState } from "react"
import { DEFAULT_DESIGN_CONFIG, DEFAULT_MEASUREMENTS } from "../defaults"
import { LeftSide } from "../components/left"
import { readLS, writeLS } from "../localStorageMap"
import { Sketches } from "../components/sketches"
import { is_pattern_config, PatternConfig } from "@/Patterns/patterns"

type StoffStoffPageProps = {
    leftVisible: boolean
}

export function StoffStoffPage({ leftVisible }: StoffStoffPageProps) {
    const [designData, setDesignData] = useState<PatternConfig>(() => {
        const saved = readLS("designDataText")
        try {
            const res = JSON.parse(saved as any)
            let is_config: string | true
            try {
                is_config = is_pattern_config(res.pattern_name, res)
            } catch {
                throw new Error(`You need to specify an object with the "pattern_name" key.`)
            }
            if (typeof is_config == "string") {
                throw new Error(is_config)
            }
            return res
        } catch (e: any) {
            const err: Error = e
            console.log(err.message)
            return DEFAULT_DESIGN_CONFIG
        }
    })

    const [measureData, setMeasureData] = useState(() => {
        const saved = readLS("measureDataText")
        try {
            const res = JSON.parse(saved as any)
            return res
        } catch (e: any) {
            const err: Error = e
            console.log(err.message)

            return DEFAULT_MEASUREMENTS
        }
    })

    useEffect(() => writeLS("designDataText", JSON.stringify(designData)), [designData])
    useEffect(() => writeLS("measureDataText", JSON.stringify(measureData)), [measureData])

    return (
        <div className="sp__page">
            <div className="sp__main">

                {leftVisible ? (
                    <LeftSide
                        designData={designData}
                        setDesignData={setDesignData}
                        measureData={measureData}
                        setMeasureData={setMeasureData}
                    />
                ) : null}

                <Sketches designData={designData} measureData={measureData} />
            </div>
        </div>
    )
}
