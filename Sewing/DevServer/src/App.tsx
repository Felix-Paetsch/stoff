import "./pages/shared/root.css";
import "./pages/shared/shared.css";

import { useEffect, useState } from "react";
import { DEFAULT_DESIGN_CONFIG } from "./config/defaults";
import { create_design_data } from "./lib/create_design_data";
import {
    is_pattern_config_with_pattern_name,
    PatternConfigWithName,
} from "./lib/is_pattern_config";
import { } from "./lib/sketch_tooltips";
import { DebugPage } from "./pages/debug";
import { MainPage } from "./pages/main";
import { readLS, writeLS } from "./utils/localStorageMap";

type SubPage = "stoffstoff" | "debug";

export function App() {
    const [page, setPage] = useState<SubPage>(() => {
        return readLS("currentPageVisible", "stoffstoff") as SubPage;
    });
    useEffect(() => {
        writeLS("currentPageVisible", page);
    }, [page]);

    const [mainPageInputVisible, setMainPageInputVisible] = useState(() => {
        const raw = readLS("mainPageInputVisible", "true");
        return raw === null ? true : raw === "true";
    });

    function toggleLeftVisible() {
        setMainPageInputVisible((v) => {
            const next = !v;
            writeLS("mainPageInputVisible", String(next));
            return next;
        });
    }

    const designInputData = useGetDesignInputData();
    // We need this up here, as this computation has side effects (the debug views)
    const { design, debug: debugRenderData } = create_design_data(
        designInputData.designData
    );

    return (
        <div className="root__app">
            <div
                className="root__topbar"
                role="tablist"
                aria-label="Start pages"
            >
                <button
                    className={
                        "root__topbarBtn" +
                        (page === "stoffstoff"
                            ? " root__topbarBtn--active"
                            : "")
                    }
                    type="button"
                    onClick={() => {
                        if (page === "stoffstoff") {
                            toggleLeftVisible();
                        } else {
                            setPage("stoffstoff");
                        }
                    }}
                    role="tab"
                    aria-selected={page === "stoffstoff"}
                >
                    StoffStoff
                </button>

                <button
                    className={
                        "root__topbarBtn" +
                        (page === "debug" ? " root__topbarBtn--active" : "")
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
                <DebugPage debugRenderData={debugRenderData} />
            )}
        </div>
    );
}

export type DesignInputData = ReturnType<typeof useGetDesignInputData>;
function useGetDesignInputData() {
    const [designData, setDesignData] = useState<PatternConfigWithName>(() => {
        const saved = readLS(
            "designDataText",
            JSON.stringify(DEFAULT_DESIGN_CONFIG),
        );

        const res: unknown = JSON.parse(saved);
        const is_config = is_pattern_config_with_pattern_name(res);

        if (typeof is_config === "string") {
            console.log(new Error(is_config));
            return DEFAULT_DESIGN_CONFIG;
        }

        return res as PatternConfigWithName;
    });

    useEffect(() => {
        writeLS("designDataText", JSON.stringify(designData));
    }, [designData]);

    return {
        designData,
        setDesignData
    } as const;
}
