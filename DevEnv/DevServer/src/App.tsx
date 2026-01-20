import { DebugPage } from "./pages/debug"
import { readLS, writeLS } from "./utils/localStorageMap"
import { MainPage } from "./pages/main"
import { DEFAULT_DESIGN_CONFIG, DEFAULT_MEASUREMENTS } from "./config/defaults"
import { useEffect, useState } from "react"
import { is_pattern_config_with_pattern_name } from "./lib/is_pattern_config"
import { create_design, PatternConfig } from "@/Patterns/patterns"
import { create_design_data } from "./lib/create_design_data"

type SubPage = "stoffstoff" | "debug"

export function App() {
    const [page, setPage] = useState<SubPage>(() => {
        return readLS("currentPageVisible", "stoffstoff") as SubPage;
    });
    useEffect(() => {
        writeLS("currentPageVisible", page)
    }, [page]);

    const [mainPageInputVisible, setMainPageInputVisible] = useState(() => {
        const raw = readLS("mainPageInputVisible", "true");
        return raw === null ? true : raw === "true"
    })

    function toggleLeftVisible() {
        setMainPageInputVisible((v) => {
            const next = !v
            writeLS("mainPageInputVisible", String(next))
            return next
        });
    }

    const designInputData = getDesignInputData();
    // We need this up here, as this computation has side effects (the debug views)
    const {
        design,
        debug: debugRenderData
    } = create_design_data(designInputData.designData, designInputData.measureData);

    return (
        <div className="sp">
            <div className="sp__topbar" role="tablist" aria-label="Start pages">
                <button
                    className={
                        "sp__topbarBtn" +
                        (page === "stoffstoff" ? " sp__topbarBtn--active" : "")
                    }
                    type="button"
                    onClick={() => {
                        if (page === "stoffstoff") {
                            toggleLeftVisible()
                        } else {
                            setPage("stoffstoff")
                        }
                    }}
                    role="tab"
                    aria-selected={page === "stoffstoff"}
                >
                    StoffStoff
                </button>

                <button
                    className={
                        "sp__topbarBtn" + (page === "debug" ? " sp__topbarBtn--active" : "")
                    }
                    type="button"
                    onClick={() => setPage("debug")}
                    role="tab"
                    aria-selected={page === "debug"}
                >
                    Debug
                </button>
            </div>

            {page === "stoffstoff" ? (
                <MainPage
                    inputVisible={mainPageInputVisible}
                    designInputData={designInputData}
                    design={design}
                />
            ) : (
                <DebugPage
                    debugRenderData={debugRenderData}
                />
            )}
        </div>
    )
}

export type DesignInputData = ReturnType<typeof getDesignInputData>;
function getDesignInputData() {
    const [designData, setDesignData] = useState<PatternConfig>(() => {
        const saved = readLS(
            "designDataText",
            JSON.stringify(DEFAULT_DESIGN_CONFIG)
        )

        const res: unknown = JSON.parse(saved)
        const is_config = is_pattern_config_with_pattern_name(
            res
        )

        if (typeof is_config === "string") {
            console.log(new Error(is_config))
            return DEFAULT_DESIGN_CONFIG
        }

        return res as any;
    })

    const [measureData, setMeasureData] = useState(() => {
        const saved = readLS(
            "measureDataText",
            JSON.stringify(DEFAULT_MEASUREMENTS)
        )

        try {
            return JSON.parse(saved)
        } catch (e: any) {
            console.log(e.message)
            return DEFAULT_MEASUREMENTS
        }
    })

    return {
        designData,
        setDesignData,
        measureData,
        setMeasureData
    } as const;
}
