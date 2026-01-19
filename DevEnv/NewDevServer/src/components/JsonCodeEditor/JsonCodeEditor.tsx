import { useEffect, useMemo, useRef } from 'react'

import './JsonCodeEditor.css'

type Props = {
	title: string
	value: string
	onChange: (next: string) => void
	onBlurParse: () => void
	error?: string | null
	helpText?: string
	storageKey?: string
	placeholder?: string
}

function escapeHtml(s: string): string {
	return s
		.replaceAll('&', '&amp;')
		.replaceAll('<', '&lt;')
		.replaceAll('>', '&gt;')
}

function highlightJsonLike(input: string): string {
	// Minimal highlighting for strict JSON.
	// Order matters: strings first.
	const s = escapeHtml(input)

	// Highlight strings (double quoted only, per JSON spec)
	const withStrings = s.replace(
		/("(?:\\.|[^"\\])*")/g,
		'<span class="jce__string">$1</span>',
	)


	// Numbers
	const withNumbers = withStrings.replace(
		/(?<![\w.])(-?\d+(?:\.\d+)?)(?![\w.])/g,
		'<span class="jce__number">$1</span>',
	)

	// Booleans / null
	const withConsts = withNumbers.replace(
		/(?<![\w.])(true|false|null)(?![\w.])/g,
		'<span class="jce__const">$1</span>',
	)


	// Keys: strictly quoted keys before ':'
	const withKeys = withConsts.replace(
		/(^|[\s{,])(<span class="jce__string">"(?:\\.|[^"\\])*"<\/span>)(?=\s*:)/g,
		(_, p1, keySpan) => `${p1}<span class="jce__key">${keySpan}</span>`,
	)

	return withKeys
}


export function JsonCodeEditor({
	title,
	value,
	onChange,
	onBlurParse,
	error,
	helpText,
	placeholder,
}: Props) {
	const textareaRef = useRef<HTMLTextAreaElement | null>(null)
	const highlightRef = useRef<HTMLPreElement | null>(null)

	const highlighted = useMemo(() => highlightJsonLike(value) + '\n', [value])

	function syncScroll() {
		const ta = textareaRef.current
		const pre = highlightRef.current
		if (!ta || !pre) return
		pre.scrollTop = ta.scrollTop
		pre.scrollLeft = ta.scrollLeft
	}

	// Auto-grow textarea to fit contents
	useEffect(() => {
		const ta = textareaRef.current
		if (!ta) return
		ta.style.height = '0px'
		ta.style.height = `${ta.scrollHeight}px`
	}, [value])

	return (
		<section className="jce">
			<div className="jce__header">
				<div className="jce__title">{title}</div>
				{helpText ? <div className="jce__help">{helpText}</div> : null}
			</div>

			<div className={`jce__editor ${error ? 'jce__editor--error' : ''}`}>
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
					onChange={(e) => onChange(e.target.value)}
					onScroll={syncScroll}
					onBlur={onBlurParse}
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
