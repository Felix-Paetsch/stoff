import { SourceMapConsumer } from "source-map";
import mappingsWasmUrl from "source-map/lib/mappings.wasm?url";

type StackFrame = {
    url: string;
    line: number;
    column: number;
};

type MapStackTraceOptions = {
    debug?: boolean;
};

let initialized = false;
function ensureSourceMapWasmInitialized() {
    if (initialized) return;
    SourceMapConsumer.initialize({
        "lib/mappings.wasm": mappingsWasmUrl,
    });
    initialized = true;
}

type CachedConsumer = {
    consumer: SourceMapConsumer;
    // Base URL to resolve sources against (map URL if external, else module URL)
    baseUrl: string;
};

const consumerCache = new Map<string, CachedConsumer | null>();

function extractFrame(stackLine: string): StackFrame | null {
    // Firefox: func@url:line:col
    let m = stackLine.match(/@(.+?):(\d+):(\d+)\s*$/);
    if (m) {
        return { url: m[1], line: Number(m[2]), column: Number(m[3]) };
    }

    // Chrome: at func (url:line:col) / at url:line:col
    m = stackLine.match(/\(?(.+?):(\d+):(\d+)\)?\s*$/);
    if (m) {
        const url = m[1];
        if (
            url.startsWith("http://") ||
            url.startsWith("https://") ||
            url.startsWith("file://")
        ) {
            return { url, line: Number(m[2]), column: Number(m[3]) };
        }
    }

    return null;
}

function findSourceMappingUrl(jsText: string): string | null {
    const re = /\/\/[#@]\s*sourceMappingURL\s*=\s*(\S+)\s*$/gm;

    let last: string | null = null;
    let match: RegExpExecArray | null = null;

    while ((match = re.exec(jsText)) !== null) {
        last = match[1];
    }

    return last;
}

function decodeDataUrlToJson(dataUrl: string): any {
    const comma = dataUrl.indexOf(",");
    if (comma === -1) throw new Error("Invalid data URL sourcemap");

    const meta = dataUrl.slice(0, comma);
    const data = dataUrl.slice(comma + 1);

    if (meta.includes(";base64")) {
        const json = atob(data);
        return JSON.parse(json);
    }

    const json = decodeURIComponent(data);
    return JSON.parse(json);
}

function mapUrlByAppendingDotMap(fileUrl: string): string {
    const u = new URL(fileUrl, window.location.origin);
    u.pathname = `${u.pathname}.map`;
    return u.toString();
}

async function fetchSourcemapForModuleUrl(
    moduleUrl: string,
    debug: boolean,
): Promise<{ rawMap: any; baseUrl: string } | null> {
    // 1) Fetch module code and read sourceMappingURL
    try {
        const jsRes = await fetch(moduleUrl);
        if (!jsRes.ok) throw new Error(`Failed to fetch module: ${moduleUrl}`);
        const jsText = await jsRes.text();

        const sm = findSourceMappingUrl(jsText);
        if (sm) {
            if (debug) {
                console.log("[mapStackTrace] sourceMappingURL found", {
                    moduleUrl,
                    sourceMappingUrl: sm.slice(0, 140),
                });
            }

            if (sm.startsWith("data:")) {
                return { rawMap: decodeDataUrlToJson(sm), baseUrl: moduleUrl };
            }

            const mapUrl = new URL(sm, moduleUrl).toString();
            const mapRes = await fetch(mapUrl);
            if (!mapRes.ok) throw new Error(`Failed to fetch sourcemap: ${mapUrl}`);

            return { rawMap: await mapRes.json(), baseUrl: mapUrl };
        }

        if (debug) {
            console.log("[mapStackTrace] no sourceMappingURL in module", {
                moduleUrl,
            });
        }
    } catch (e) {
        if (debug) {
            console.log("[mapStackTrace] module fetch failed", { moduleUrl, e });
        }
    }

    // 2) Fallback: try `${url}.map`
    try {
        const mapUrl = mapUrlByAppendingDotMap(moduleUrl);
        const mapRes = await fetch(mapUrl);
        if (!mapRes.ok) return null;

        if (debug) {
            console.log("[mapStackTrace] fallback .map worked", { mapUrl });
        }

        return { rawMap: await mapRes.json(), baseUrl: mapUrl };
    } catch {
        return null;
    }
}

async function getConsumerForModuleUrl(
    moduleUrl: string,
    debug: boolean,
): Promise<CachedConsumer | null> {
    ensureSourceMapWasmInitialized();

    if (consumerCache.has(moduleUrl)) return consumerCache.get(moduleUrl)!;

    const result = await fetchSourcemapForModuleUrl(moduleUrl, debug);
    if (!result) {
        consumerCache.set(moduleUrl, null);
        return null;
    }

    try {
        const consumer = await new SourceMapConsumer(result.rawMap);
        const cached: CachedConsumer = { consumer, baseUrl: result.baseUrl };
        consumerCache.set(moduleUrl, cached);
        return cached;
    } catch (e) {
        if (debug) {
            console.log("[mapStackTrace] failed to create SourceMapConsumer", {
                moduleUrl,
                e,
            });
        }
        consumerCache.set(moduleUrl, null);
        return null;
    }
}

function resolveFullSourcePath(
    source: string,
    consumer: SourceMapConsumer,
    baseUrl: string,
): string {
    // If it's already a URL-like source (rare but possible), keep it.
    if (
        source.startsWith("http://") ||
        source.startsWith("https://") ||
        source.startsWith("file://")
    ) {
        return source;
    }

    // sourceRoot can be absolute, relative, or undefined.
    // Resolve it against the map URL/module URL to get an absolute base.
    const sourceRoot = consumer.sourceRoot ?? "";
    const rootBase = new URL(sourceRoot || ".", baseUrl);

    // Then resolve the source against that.
    return new URL(source, rootBase).toString();
}

export async function mapStackTrace(
    error: Error,
    options: MapStackTraceOptions = {},
): Promise<string> {
    const debug = Boolean(options.debug);

    if (!error.stack) return `${error.name}: ${error.message}`;

    const lines = error.stack.split("\n");

    const mapped = await Promise.all(
        lines.map(async (line) => {
            const frame = extractFrame(line);
            if (!frame) return line;

            const cached = await getConsumerForModuleUrl(frame.url, debug);
            if (!cached) return line;

            const { consumer, baseUrl } = cached;

            // Stack columns are usually 1-based; source-map expects 0-based.
            const generatedColumn = Math.max(0, frame.column - 1);

            const pos = consumer.originalPositionFor({
                line: frame.line,
                column: generatedColumn,
            });

            if (!pos.source || pos.line == null || pos.column == null) return line;

            const displayColumn = pos.column + 1;
            const fullSource = resolveFullSourcePath(pos.source, consumer, baseUrl);

            return line.replace(
                `${frame.url}:${frame.line}:${frame.column}`,
                `${fullSource}:${pos.line}:${displayColumn}`,
            );
        }),
    );

    return mapped.join("\n");
}

export function deleteStackTraceFromFirstTSX(stack: string): string {
    const lines = stack.split("\n");
    const firstTsxIndex = lines.findIndex(
        (line, i) => i !== 0 && /\.tsx(\?|:)/.test(line),
    );

    if (firstTsxIndex === -1) return stack;
    return lines.slice(0, firstTsxIndex).join("\n");
}
