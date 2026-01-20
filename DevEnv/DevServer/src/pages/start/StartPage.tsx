import "./startPage.css"
import { useState } from "react"
import { DebugPage } from "./pages/DebugPage"
import { StoffStoffPage } from "./pages/StoffStoffPage"
import { readLS, writeLS } from "./localStorageMap"

type StartSubPage = "stoffstoff" | "debug"

export function StartPage() {
    const [page, setPage] = useState<StartSubPage>("stoffstoff")

    const [leftVisible, setLeftVisible] = useState(() => {
        const raw = readLS("leftVisible")
        return raw === null ? true : raw === "true"
    })

    function toggleLeftVisible() {
        setLeftVisible((v) => {
            const next = !v
            writeLS("leftVisible", String(next))
            return next
        })
    }

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
                <StoffStoffPage leftVisible={leftVisible} />
            ) : (
                <DebugPage />
            )}
        </div>
    )
}


