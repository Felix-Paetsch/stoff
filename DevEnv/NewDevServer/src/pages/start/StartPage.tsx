import { useEffect, useMemo, useState } from 'react'
import { JsonCodeEditor } from '../../components/JsonCodeEditor'
import { parseJsonStrict } from '../../lib/json'

import { generatePreviewItems } from '../../lib/svgGenerator'

import { DEFAULT_DESIGN_CONFIG_TEXT, DEFAULT_MEASUREMENTS_TEXT } from './defaults'
import './startPage.css'

const LS = {
    leftVisible: 'stoffstoff2.leftVisible',
    designText: 'stoffstoff2.designConfigText',
    measureText: 'stoffstoff2.measurementsText',
    lastGoodDesign: 'stoffstoff2.lastGoodDesign',
    lastGoodMeasure: 'stoffstoff2.lastGoodMeasure',
} as const

function readLS(key: string): string | null {
    try {
        return localStorage.getItem(key)
    } catch {
        return null
    }
}

function writeLS(key: string, value: string) {
    try {
        localStorage.setItem(key, value)
    } catch {
        // ignore
    }
}

export function StartPage() {
    const [leftVisible, setLeftVisible] = useState(() => {
        const raw = readLS(LS.leftVisible)
        return raw === null ? true : raw === 'true'
    })

    const [designText, setDesignText] = useState(() => {
        const saved = readLS(LS.designText)
        // If older (non-strict) content was saved previously, ignore it and fall back to defaults.
        if (saved) {
            const res = parseJsonStrict(saved)
            if (res.ok) return saved
        }
        return DEFAULT_DESIGN_CONFIG_TEXT
    })

    const [measureText, setMeasureText] = useState(() => {
        const saved = readLS(LS.measureText)
        if (saved) {
            const res = parseJsonStrict(saved)
            if (res.ok) return saved
        }
        return DEFAULT_MEASUREMENTS_TEXT
    })


    const [designError, setDesignError] = useState<string | null>(null)
    const [measureError, setMeasureError] = useState<string | null>(null)

    const [designData, setDesignData] = useState<Record<string, unknown>>(() => {
        const saved = readLS(LS.lastGoodDesign)
        if (saved) {
            const res = parseJsonStrict<Record<string, unknown>>(saved)

            if (res.ok && res.value && typeof res.value === 'object') return res.value
        }
        const res = parseJsonStrict<Record<string, unknown>>(DEFAULT_DESIGN_CONFIG_TEXT)

        return res.ok && res.value && typeof res.value === 'object' ? res.value : {}
    })

    const [measureData, setMeasureData] = useState<Record<string, unknown>>(() => {
        const saved = readLS(LS.lastGoodMeasure)
        if (saved) {
            const res = parseJsonStrict<Record<string, unknown>>(saved)

            if (res.ok && res.value && typeof res.value === 'object') return res.value
        }
        const res = parseJsonStrict<Record<string, unknown>>(DEFAULT_MEASUREMENTS_TEXT)

        return res.ok && res.value && typeof res.value === 'object' ? res.value : {}
    })

    useEffect(() => writeLS(LS.designText, designText), [designText])
    useEffect(() => writeLS(LS.measureText, measureText), [measureText])


    // Parse once on mount so the preview reflects saved/default values immediately.
    useEffect(() => {
        parseDesignOnBlur()
        parseMeasureOnBlur()
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [])


    function onToggleLeft() {
        setLeftVisible((v) => {
            const next = !v
            writeLS(LS.leftVisible, String(next))
            return next
        })
    }


    function parseDesignOnBlur() {
        const res = parseJsonStrict<Record<string, unknown>>(designText)

        if (!res.ok || !res.value || typeof res.value !== 'object') {
            setDesignError((res.ok ? new Error('Parsed value is not an object') : res.error).stack ?? String(res.ok ? 'Invalid object' : res.error))
            return
        }
        setDesignError(null)
        setDesignData(res.value)
        writeLS(LS.lastGoodDesign, designText)
    }

    function parseMeasureOnBlur() {
        const res = parseJsonStrict<Record<string, unknown>>(measureText)

        if (!res.ok || !res.value || typeof res.value !== 'object') {
            setMeasureError((res.ok ? new Error('Parsed value is not an object') : res.error).stack ?? String(res.ok ? 'Invalid object' : res.error))
            return
        }
        setMeasureError(null)
        setMeasureData(res.value)
        writeLS(LS.lastGoodMeasure, measureText)
    }

    const preview = useMemo(() => {
        try {
            return { ok: true as const, items: generatePreviewItems(designData, measureData) }
        } catch (e) {
            const err = e instanceof Error ? e : new Error(String(e))
            return { ok: false as const, error: err }
        }
    }, [designData, measureData])

    return (
        <div className="sp">
            <button className="sp__topbar" type="button" onClick={onToggleLeft}>
                StoffStoff2
            </button>

            <div className="sp__main">
                {leftVisible ? (
                    <aside className="sp__left" aria-label="Inputs">
                        <div className="sp__leftInner">
                            <JsonCodeEditor
                                title="Design Config"
                                value={designText}
                                onChange={setDesignText}
                                onBlurParse={parseDesignOnBlur}
                                error={designError}
                            />


                            <JsonCodeEditor
                                title="Measurements"
                                value={measureText}
                                onChange={setMeasureText}
                                onBlurParse={parseMeasureOnBlur}
                                error={measureError}
                            />


                            <section className="sp__defaults">
                                <div className="sp__defaultsHeader">Defaults</div>


                                <div className="sp__defaultBlock">
                                    <div className="sp__defaultTitleRow">
                                        <div className="sp__defaultTitle">Design Config</div>
                                        <button
                                            className="sp__copyBtn"
                                            type="button"
                                            onClick={() => {
                                                setDesignText(DEFAULT_DESIGN_CONFIG_TEXT)
                                                setDesignError(null)
                                            }}
                                        >
                                            Copy
                                        </button>
                                    </div>
                                    <pre className="sp__defaultPre">{DEFAULT_DESIGN_CONFIG_TEXT}</pre>
                                </div>

                                <div className="sp__defaultBlock">
                                    <div className="sp__defaultTitleRow">
                                        <div className="sp__defaultTitle">Measurements</div>
                                        <button
                                            className="sp__copyBtn"
                                            type="button"
                                            onClick={() => {
                                                setMeasureText(DEFAULT_MEASUREMENTS_TEXT)
                                                setMeasureError(null)
                                            }}
                                        >
                                            Copy
                                        </button>
                                    </div>
                                    <pre className="sp__defaultPre">{DEFAULT_MEASUREMENTS_TEXT}</pre>
                                </div>
                            </section>
                        </div>
                    </aside>
                ) : null}

                <main className="sp__right" aria-label="Preview">
                    <div className="sp__rightInner">
                        {preview.ok ? (
                            <div className="sp__previewList">
                                {preview.items.map((item) => (
                                    <div key={item.id} className="sp__previewItem">
                                        <div className="sp__previewSvg">{item.svg}</div>
                                        <div className="sp__previewText">
                                            <div className="sp__previewLabel">{item.label}</div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="sp__previewError">
                                <div className="sp__previewErrorTitle">Preview generation failed</div>
                                <pre className="sp__previewErrorStack">{preview.error.stack ?? String(preview.error)}</pre>
                            </div>
                        )}
                    </div>
                </main>

            </div>
        </div>
    )
}
