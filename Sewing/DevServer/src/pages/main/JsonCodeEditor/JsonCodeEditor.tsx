import { useEffect, useRef, useState } from "react"

import "./JsonCodeEditor.css"

type Props = {
    title: string
    initial_value?: string
    onChange?: (next: string) => void
    onBlur?: (current: string) => void
    error?: string | null
    helpText?: string
    placeholder?: string
}

function escapeHtml(s: string): string {
    return s
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
}

function highlightJsonLike(input: string): string {
    const s = escapeHtml(input)

    const withStrings = s.replace(
        /("(?:\\.|[^"\\])*")/g,
        '<span class="jce__string">$1</span>'
    )

    const withNumbers = withStrings.replace(
        /(?<![\w.])(-?\d+(?:\.\d+)?)(?![\w.])/g,
        '<span class="jce__number">$1</span>'
    )

    const withConsts = withNumbers.replace(
        /(?<![\w.])(true|false|null)(?![\w.])/g,
        '<span class="jce__const">$1</span>'
    )

    const withKeys = withConsts.replace(
        /(^|[\s{,])(<span class="jce__string">"(?:\\.|[^"\\])*"<\/span>)(?=\s*:)/g,
        (_, p1, keySpan) => `${p1}<span class="jce__key">${keySpan}</span>`
    )

    return withKeys
}

export function JsonCodeEditor({
    title,
    initial_value,
    onChange,
    onBlur,
    error,
    helpText,
    placeholder,
}: Props) {
    const textareaRef = useRef<HTMLTextAreaElement | null>(null)
    const highlightRef = useRef<HTMLPreElement | null>(null)

    const [value, setValue] = useState(initial_value ?? "");


    function syncScroll() {
        const ta = textareaRef.current
        const pre = highlightRef.current
        if (!ta || !pre) return
        pre.scrollTop = ta.scrollTop
        pre.scrollLeft = ta.scrollLeft
    }

    function handleChange(next: string) {
        setValue(next)
        onChange?.(next)
    }

    const highlighted = highlightJsonLike(value) + "\n";

    // Auto-grow textarea
    useEffect(() => {
        const ta = textareaRef.current
        if (!ta) return
        ta.style.height = "0px"
        ta.style.height = `${ta.scrollHeight}px`
    }, [value])

    return (
        <section className="jce">
            <div className="jce__header">
                <div className="jce__title">{title}</div>
                {helpText ? <div className="jce__help">{helpText}</div> : null}
            </div>

            <div className={`jce__editor ${error ? "jce__editor--error" : ""}`}>
                <pre
                    ref={highlightRef}
                    className="jce__highlight"
                    dangerouslySetInnerHTML={{ __html: highlighted }}
                />
                <textarea
                    ref={textareaRef}
                    className="jce__textarea"
                    spellCheck={false}
                    value={value}
                    placeholder={placeholder}
                    onChange={(e) => handleChange(e.target.value)}
                    onScroll={syncScroll}
                    onBlur={() => {
                        try {
                            const parsed = JSON.parse(value)
                            const formatted = JSON.stringify(parsed, null, 2)
                            handleChange(formatted)
                        } catch {
                            // Invalid JSON, don't format
                        }
                        onBlur?.(value)
                    }}
                />
            </div>

            {error ? (
                <pre className="jce__error" aria-live="polite">
                    {error}
                </pre>
            ) : null}
        </section>
    )
}
