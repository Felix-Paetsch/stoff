import "./debug.css"

import { Recording } from "@/Core/Debug/recording"
import { DebugRenderData } from "src/lib/create_design_data"
import { RecordingEntryView } from "./recordingEntryView"
import { NonRecordingEntryView } from "./nonRecordingEntryView"

type DebugPageProps = {
    debugRenderData: DebugRenderData
}

export function DebugPage({ debugRenderData }: DebugPageProps) {
    return (
        <div className="dbg__page">
            <div className="dbg__list">
                {debugRenderData.map((entry, index) => {
                    const EntryView =
                        entry.to_render instanceof Recording
                            ? RecordingEntryView
                            : NonRecordingEntryView

                    return (
                        <EntryView
                            key={index}
                            entry={entry as any}
                            index={index}
                        />
                    )
                })}
            </div>
        </div>
    )
}
