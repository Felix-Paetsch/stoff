import React from 'react'

export type PreviewItem = {
	id: string
	label: string
	svg: React.ReactNode
}

function clamp(n: number, min: number, max: number): number {
	return Math.max(min, Math.min(max, n))
}

function num(value: unknown, fallback: number): number {
	return typeof value === 'number' && Number.isFinite(value) ? value : fallback
}

/**
 * Dummy generator: turns config+measurements into a list of preview SVGs.
 *
 * This is intentionally small, but it can throw to exercise the error UI.
 */
export function generatePreviewItems(
	designConfig: Record<string, unknown>,
	measurements: Record<string, unknown>,
): PreviewItem[] {
	const patternName = String(designConfig.pattern_name ?? '')
	if (!patternName) {
		throw new Error('designConfig.pattern_name is required')
	}

	// A few dimensions derived from measurements.
	const bust = num(measurements.bust_width, 90)
	const waist = num(measurements.waist_width, 75)
	const shoulder = num(measurements.shoulder_width, 40)

	// If someone sets this, we intentionally fail to test rendering.
	if (designConfig.__forceError === true) {
		throw new Error('Forced error: designConfig.__forceError === true')
	}

	const w = 220
	const h = 140

	const bodyTop = clamp(shoulder * 2.2, 70, 200)
	const bodyMid = clamp(bust * 1.7, 70, 210)
	const bodyBottom = clamp(waist * 1.7, 70, 210)

	const svgStyle: React.CSSProperties = { display: 'block' }

	return [
		{
			id: 'front',
			label: `${patternName} – Front`,
			svg: (
				<svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} style={svgStyle}>
					<rect x={1} y={1} width={w - 2} height={h - 2} rx={10} fill="#ffffff" stroke="#cbd5e1" />
					<path
						d={`M ${w / 2 - bodyTop / 2} 18 L ${w / 2 + bodyTop / 2} 18 L ${w / 2 + bodyMid / 2} 62 L ${w / 2 + bodyBottom / 2} 122 L ${w / 2 - bodyBottom / 2} 122 L ${w / 2 - bodyMid / 2} 62 Z`}
						fill="#e0f2fe"
						stroke="#0284c7"
						strokeWidth={2}
					/>
					<circle cx={w / 2} cy={30} r={10} fill="#ffffff" stroke="#0284c7" strokeWidth={2} />
					<text x={12} y={h - 12} fontSize={12} fill="#475569">
						bust={bust}, waist={waist}
					</text>
				</svg>
			),
		},
		{
			id: 'back',
			label: `${patternName} – Back`,
			svg: (
				<svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} style={svgStyle}>
					<rect x={1} y={1} width={w - 2} height={h - 2} rx={10} fill="#ffffff" stroke="#cbd5e1" />
					<path
						d={`M ${w / 2 - bodyTop / 2} 18 L ${w / 2 + bodyTop / 2} 18 L ${w / 2 + bodyMid / 2} 58 L ${w / 2 + bodyBottom / 2} 122 L ${w / 2 - bodyBottom / 2} 122 L ${w / 2 - bodyMid / 2} 58 Z`}
						fill="#dcfce7"
						stroke="#16a34a"
						strokeWidth={2}
					/>
					<path d={`M ${w / 2 - 14} 18 Q ${w / 2} 40 ${w / 2 + 14} 18`} fill="none" stroke="#16a34a" strokeWidth={2} />
				</svg>
			),
		},
		{
			id: 'sleeve',
			label: `${patternName} – Sleeve`,
			svg: (
				<svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} style={svgStyle}>
					<rect x={1} y={1} width={w - 2} height={h - 2} rx={10} fill="#ffffff" stroke="#cbd5e1" />
					<path
						d={`M 45 40 Q 110 10 175 40 Q 190 80 175 115 Q 110 130 45 115 Q 30 80 45 40 Z`}
						fill="#fef9c3"
						stroke="#ca8a04"
						strokeWidth={2}
					/>
					<text x={12} y={h - 12} fontSize={12} fill="#475569">
						shoulder={shoulder}
					</text>
				</svg>
			),
		},
	]
}
