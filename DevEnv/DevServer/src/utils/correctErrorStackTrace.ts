import { SourceMapConsumer } from "source-map";
import mappingsWasmUrl from "source-map/lib/mappings.wasm?url";

type StackFrame = {
    url: string;
    line: number;
    column: number;
    matchedText: string;
};

type MapStackTraceOptions = {
    debug?: boolean;
};

type CachedConsumer = {
    consumer: SourceMapConsumer;
    baseUrl: string;
};

let wasmInitState: "not-initialized" | "initialized" | "failed" =
    "not-initialized";

function debugLog(debug: boolean, message: string, extra?: unknown) {
    if (!debug) return;
    console.log(`[mapStackTrace] ${message}`, extra ?? "");
}

function ensureSourceMapWasmInitialized(debug: boolean) {
    if (wasmInitState === "initialized") return;
    if (wasmInitState === "failed") return;

    try {
        // @ts-ignore
        SourceMapConsumer.initialize({
            "lib/mappings.wasm": mappingsWasmUrl,
        });
        wasmInitState = "initialized";
    } catch (e) {
        wasmInitState = "failed";
        debugLog(debug, "SourceMapConsumer.initialize failed", e);
    }
}

const consumerCache = new Map<string, Promise<CachedConsumer | null>>();

function isSupportedScriptUrl(url: string): boolean {
    return (
        url.startsWith("http://") ||
        url.startsWith("https://") ||
        url.startsWith("file://")
    );
}

function extractFrame(stackLine: string): StackFrame | null {
    // Firefox: func@url:line:col
    let m = stackLine.match(/@(.+?):(\d+):(\d+)\s*$/);
    if (m) {
        const url = m[1]!;
        if (!isSupportedScriptUrl(url)) return null;

        return {
            url,
            line: Number(m[2]),
            column: Number(m[3]),
            matchedText: `${url}:${m[2]}:${m[3]}`,
        };
    }

    // Chrome:
    //   at func (url:line:col)
    //   at url:line:col
    m = stackLine.match(/\(?(.+?):(\d+):(\d+)\)?\s*$/);
    if (m) {
        const url = m[1]!;
        if (!isSupportedScriptUrl(url)) return null;

        return {
            url,
            line: Number(m[2]),
            column: Number(m[3]),
            matchedText: `${url}:${m[2]}:${m[3]}`,
        };
    }

    return null;
}

function findSourceMappingUrl(jsText: string): string | null {
    const re = /\/\/[#@]\s*sourceMappingURL\s*=\s*(\S+)\s*$/gm;

    let last: string | null = null;
    let match: RegExpExecArray | null = null;

    while ((match = re.exec(jsText)) !== null) {
        last = match[1]!;
    }

    return last;
}

function decodeBase64Utf8(base64: string): string {
    const binary = atob(base64);
    const bytes = Uint8Array.from(binary, (char) => char.charCodeAt(0));
    return new TextDecoder("utf-8").decode(bytes);
}

function decodeDataUrlToJson(dataUrl: string): any {
    const comma = dataUrl.indexOf(",");
    if (comma === -1) {
        throw new Error("Invalid data URL sourcemap");
    }

    const meta = dataUrl.slice(0, comma);
    const data = dataUrl.slice(comma + 1);

    if (meta.includes(";base64")) {
        return JSON.parse(decodeBase64Utf8(data));
    }

    return JSON.parse(decodeURIComponent(data));
}

function mapUrlByAppendingDotMap(fileUrl: string): string {
    const u = new URL(fileUrl, window.location.href);
    u.pathname = `${u.pathname}.map`;
    return u.toString();
}

async function fetchJson(url: string): Promise<any> {
    const res = await fetch(url);
    if (!res.ok) {
        throw new Error(`Failed to fetch JSON: ${url} (${res.status})`);
    }
    return res.json();
}

async function fetchText(url: string): Promise<string> {
    const res = await fetch(url);
    if (!res.ok) {
        throw new Error(`Failed to fetch text: ${url} (${res.status})`);
    }
    return res.text();
}

async function fetchSourcemapForModuleUrl(
    moduleUrl: string,
    debug: boolean,
): Promise<{ rawMap: any; baseUrl: string } | null> {
    // 1) Try reading sourceMappingURL from the module itself.
    try {
        const jsText = await fetchText(moduleUrl);
        const sm = findSourceMappingUrl(jsText);

        if (sm) {
            debugLog(debug, "sourceMappingURL found", {
                moduleUrl,
                sourceMappingUrl: sm.slice(0, 200),
            });

            if (sm.startsWith("data:")) {
                return {
                    rawMap: decodeDataUrlToJson(sm),
                    baseUrl: moduleUrl,
                };
            }

            const mapUrl = new URL(sm, moduleUrl).toString();
            return {
                rawMap: await fetchJson(mapUrl),
                baseUrl: mapUrl,
            };
        }

        debugLog(debug, "no sourceMappingURL in module", { moduleUrl });
    } catch (e) {
        debugLog(debug, "module fetch or sourceMappingURL parsing failed", {
            moduleUrl,
            e,
        });
    }

    // 2) Fallback: try `${url}.map`
    try {
        const mapUrl = mapUrlByAppendingDotMap(moduleUrl);
        const rawMap = await fetchJson(mapUrl);

        debugLog(debug, "fallback .map worked", { moduleUrl, mapUrl });

        return { rawMap, baseUrl: mapUrl };
    } catch (e) {
        debugLog(debug, "fallback .map failed", { moduleUrl, e });
        return null;
    }
}

async function createConsumerForModuleUrl(
    moduleUrl: string,
    debug: boolean,
): Promise<CachedConsumer | null> {
    ensureSourceMapWasmInitialized(debug);

    if (wasmInitState === "failed") {
        return null;
    }

    const result = await fetchSourcemapForModuleUrl(moduleUrl, debug);
    if (!result) {
        return null;
    }

    try {
        const consumer = await new SourceMapConsumer(result.rawMap);
        return {
            consumer,
            baseUrl: result.baseUrl,
        };
    } catch (e) {
        debugLog(debug, "failed to create SourceMapConsumer", {
            moduleUrl,
            e,
        });
        return null;
    }
}

async function getConsumerForModuleUrl(
    moduleUrl: string,
    debug: boolean,
): Promise<CachedConsumer | null> {
    const cachedPromise = consumerCache.get(moduleUrl);
    if (cachedPromise) {
        return cachedPromise;
    }

    const promise = createConsumerForModuleUrl(moduleUrl, debug).catch((e) => {
        debugLog(debug, "unexpected consumer creation failure", {
            moduleUrl,
            e,
        });
        return null;
    });

    consumerCache.set(moduleUrl, promise);

    const result = await promise;

    // If creation failed, remove it so a later call can retry.
    if (result == null) {
        consumerCache.delete(moduleUrl);
    }

    return result;
}

function resolveFullSourcePath(
    source: string,
    consumer: SourceMapConsumer,
    baseUrl: string,
): string {
    if (isSupportedScriptUrl(source)) {
        return source;
    }

    try {
        // @ts-ignore
        const sourceRoot = consumer.sourceRoot ?? "";
        const rootBase = new URL(sourceRoot || ".", baseUrl);
        return new URL(source, rootBase).toString();
    } catch {
        return source;
    }
}

function isReasonableFrame(frame: StackFrame): boolean {
    return (
        Number.isInteger(frame.line) &&
        Number.isInteger(frame.column) &&
        frame.line > 0 &&
        frame.column > 0
    );
}

async function mapSingleStackLine(
    line: string,
    debug: boolean,
): Promise<string> {
    try {
        const frame = extractFrame(line);
        if (!frame) {
            return line;
        }

        if (!isReasonableFrame(frame)) {
            debugLog(debug, "skipping unreasonable frame", { frame, line });
            return line;
        }

        const cached = await getConsumerForModuleUrl(frame.url, debug);
        if (!cached) {
            return line;
        }

        const { consumer, baseUrl } = cached;

        // Browser stack columns are usually 1-based.
        const generatedColumn = Math.max(0, frame.column - 1);

        let pos:
            | {
                  source: string | null;
                  line: number | null;
                  column: number | null;
                  name?: string | null;
              }
            | undefined;

        try {
            pos = consumer.originalPositionFor({
                line: frame.line,
                column: generatedColumn,
            });
        } catch (e) {
            debugLog(debug, "originalPositionFor failed", {
                frame,
                line,
                e,
            });
            return line;
        }

        if (!pos?.source || pos.line == null || pos.column == null) {
            return line;
        }

        const fullSource = resolveFullSourcePath(pos.source, consumer, baseUrl);
        const displayColumn = pos.column + 1;
        const replacement = `${fullSource}:${pos.line}:${displayColumn}`;

        if (!line.includes(frame.matchedText)) {
            return line;
        }

        return line.replace(frame.matchedText, replacement);
    } catch (e) {
        debugLog(debug, "failed to map stack line", { line, e });
        return line;
    }
}

export async function mapStackTrace(
    error: Error | string,
    options: MapStackTraceOptions = {},
): Promise<string> {
    const debug = Boolean(options.debug);

    try {
        if (error instanceof Error) {
            if (!error.stack) {
                return `${error.name}: ${error.message}`;
            }

            error = error.stack!;
        }

        const lines = error.split("\n");
        const mapped = await Promise.all(
            lines.map((line) => mapSingleStackLine(line, debug)),
        );

        return mapped.join("\n");
    } catch (e) {
        debugLog(debug, "mapStackTrace failed entirely, returning original", e);
        if (typeof error == "string") {
            return error;
        }

        return error.stack ?? `${error.name}: ${error.message}`;
    }
}

export function clearStackTraceSourceMapCache() {
    consumerCache.clear();
}

export function deleteStackTraceFromFirstTSX(stack: string): string {
    const lines = stack.split("\n");
    const firstTsxIndex = lines.findIndex(
        (line, i) => i !== 0 && /\.tsx(\?|:)/.test(line),
    );

    if (firstTsxIndex === -1) {
        return stack;
    }

    return lines.slice(0, firstTsxIndex).join("\n");
}
