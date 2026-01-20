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

// Must run BEFORE using SourceMapConsumer in the browser (source-map v0.8+)
let initialized = false;
function ensureSourceMapWasmInitialized() {
    if (initialized) return;

    // @ts-ignore
    SourceMapConsumer.initialize({
        "lib/mappings.wasm": mappingsWasmUrl,
    });
    initialized = true;
}

const consumerCache = new Map<string, SourceMapConsumer | null>();

function extractFrame(stackLine: string): StackFrame | null {
    // Firefox:
    //   func@http://host/path/file.js:1:234
    //   @http://host/path/file.js:1:234
    let m = stackLine.match(/@(.+?):(\d+):(\d+)\s*$/);
    if (m) {
        return {
            url: m[1],
            line: Number(m[2]),
            column: Number(m[3]),
        };
    }

    // Chrome:
    //   at func (http://host/path/file.js:1:234)
    //   at http://host/path/file.js:1:234
    m = stackLine.match(/\(?(.+?):(\d+):(\d+)\)?\s*$/);
    if (m) {
        const url = m[1];
        if (
            url.startsWith("http://") ||
            url.startsWith("https://") ||
            url.startsWith("file://")
        ) {
            return {
                url,
                line: Number(m[2]),
                column: Number(m[3]),
            };
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
): Promise<any | null> {
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
                return decodeDataUrlToJson(sm);
            }

            const mapUrl = new URL(sm, moduleUrl).toString();
            const mapRes = await fetch(mapUrl);
            if (!mapRes.ok) throw new Error(`Failed to fetch sourcemap: ${mapUrl}`);
            return await mapRes.json();
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
        return await mapRes.json();
    } catch {
        return null;
    }
}

async function getConsumerForModuleUrl(
    moduleUrl: string,
    debug: boolean,
): Promise<SourceMapConsumer | null> {
    ensureSourceMapWasmInitialized();

    if (consumerCache.has(moduleUrl)) return consumerCache.get(moduleUrl)!;

    const rawMap = await fetchSourcemapForModuleUrl(moduleUrl, debug);
    if (!rawMap) {
        consumerCache.set(moduleUrl, null);
        return null;
    }

    try {
        const consumer = await new SourceMapConsumer(rawMap);
        consumerCache.set(moduleUrl, consumer);
        return consumer;
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

            const consumer = await getConsumerForModuleUrl(frame.url, debug);
            if (!consumer) return line;

            // IMPORTANT:
            // Most JS engine stacks report columns as 1-based.
            // source-map expects generated columns as 0-based.
            const generatedColumn = Math.max(0, frame.column - 1);

            const pos = consumer.originalPositionFor({
                line: frame.line,
                column: generatedColumn,
            });

            if (!pos.source || pos.line == null || pos.column == null) {
                return line;
            }

            // pos.column is 0-based; display as 1-based
            const displayColumn = pos.column + 1;

            return line.replace(
                `${frame.url}:${frame.line}:${frame.column}`,
                `${pos.source}:${pos.line}:${displayColumn}`,
            );
        }),
    );

    return mapped.join("\n");
}
