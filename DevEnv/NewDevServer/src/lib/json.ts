export type JsonParseResult<T> =
	| { ok: true; value: T }
	| { ok: false; error: Error }

/**
 * Strict JSON parsing wrapper.
 */
export function parseJsonStrict<T = unknown>(input: string): JsonParseResult<T> {
	try {
		const trimmed = input.trim().replace(/^\uFEFF/, '')
		if (trimmed === '') {
			throw new Error('Empty input')
		}
		return { ok: true, value: JSON.parse(trimmed) as T }
	} catch (e) {
		const err = e instanceof Error ? e : new Error(String(e))
		return { ok: false, error: err }
	}
}

export function safeStringify(value: unknown): string {
	try {
		return JSON.stringify(value, null, 2)
	} catch {
		return String(value)
	}
}

