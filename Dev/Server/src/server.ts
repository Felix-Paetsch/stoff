import chokidar from "chokidar";
import express from "express";
import fs from "node:fs/promises";
import { createServer } from "node:http";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { WebSocketServer } from "ws";
import type {
    CJson,
    Config,
    FileKind,
    FileRecord,
    ServerMessage,
} from "./types.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const ROOT_DIR = path.resolve(__dirname, "..");
const SRC_PUBLIC_DIR = path.join(ROOT_DIR, "src", "public");
const PUBLIC_BUILD_DIR = path.join(ROOT_DIR, "public-build", "public");
const PUBLIC_BUILD_ROOT = path.join(ROOT_DIR, "public-build");
const WATCHED_DIR = path.join(ROOT_DIR, "watch");

const PORT = 3000;

const app = express();
const server = createServer(app);
const wss = new WebSocketServer({ server });

let CONFIG: Config = {};

const files = new Map<string, FileRecord>();

app.use("/files", express.static(WATCHED_DIR));
app.use(express.static(SRC_PUBLIC_DIR));
app.use(express.static(PUBLIC_BUILD_DIR));
app.use(express.static(PUBLIC_BUILD_ROOT));

function compareStrings(a: string, b: string): number {
    const aParts = a.split(".");
    const bParts = b.split(".");

    for (let i = 0; i < Math.max(aParts.length, bParts.length); i++) {
        const aPart = aParts[i] ?? "";
        const bPart = bParts[i] ?? "";

        if (aPart === bPart) continue;

        const regex = /(\d+)|(\D+)/g;
        const aTokens = (aPart.match(regex) || []).map((p) =>
            /^\d+$/.test(p) ? parseInt(p, 10) : p,
        );
        const bTokens = (bPart.match(regex) || []).map((p) =>
            /^\d+$/.test(p) ? parseInt(p, 10) : p,
        );

        for (let j = 0; j < Math.max(aTokens.length, bTokens.length); j++) {
            const aToken = aTokens[j] ?? "";
            const bToken = bTokens[j] ?? "";

            if (typeof aToken === "number" && typeof bToken === "number") {
                if (aToken !== bToken) return aToken - bToken;
            } else {
                const strA = String(aToken).toLowerCase();
                const strB = String(bToken).toLowerCase();
                const cmp = strA.localeCompare(strB);
                if (cmp !== 0) return cmp;
            }
        }
    }
    return 0;
}

function getKind(ext: string): FileKind {
    const e = ext.toLowerCase();

    if ([".png", ".jpg", ".jpeg", ".gif", ".webp"].includes(e)) {
        return "image";
    }

    if (e === ".svg") {
        return "svg";
    }

    if (e === ".json") {
        return "json";
    }

    if (e === ".cjson") {
        return "cjson";
    }

    if ([".txt", ".md", ".log"].includes(e)) {
        return "text";
    }

    return "unknown";
}

async function pathExists(target: string): Promise<boolean> {
    try {
        await fs.access(target);
        return true;
    } catch {
        return false;
    }
}

async function loadConfig(): Promise<void> {
    try {
        const text = await fs.readFile("./config.json", "utf8");
        CONFIG = JSON.parse(text) as Config;
        console.log("Config loaded:", CONFIG);
    } catch (err) {
        console.log("No config found, using defaults:", CONFIG);
    }
}

async function ensureWatchedDir(): Promise<void> {
    if (!(await pathExists(WATCHED_DIR))) {
        await fs.mkdir(WATCHED_DIR, { recursive: true });
    }
}

async function buildFileRecord(absPath: string): Promise<FileRecord | null> {
    const stat = await fs.stat(absPath);
    if (!stat.isFile()) return null;

    const name = path.basename(absPath);
    const ext = path.extname(name);
    const kind = getKind(ext);

    const record: FileRecord = {
        name,
        title: name,
        ext,
        kind,
        url: `/files/${encodeURIComponent(name)}`,
        mtimeMs: stat.mtimeMs,
    };

    if (kind === "json") {
        try {
            const text = await fs.readFile(absPath, "utf8");
            record.content = JSON.parse(text);
        } catch {
            record.content = { error: "Invalid JSON" };
        }
    } else if (kind === "cjson") {
        try {
            const text = await fs.readFile(absPath, "utf8");
            record.content = JSON.parse(text);
            record.title = (record.content! as CJson).title;
        } catch {
            record.content = { error: "Invalid CJSON" };
        }
    } else if (kind === "text" || kind === "svg") {
        try {
            record.content = await fs.readFile(absPath, "utf8");
        } catch {
            record.content = "";
        }
    }

    return record;
}

function broadcast(msg: ServerMessage): void {
    const data = JSON.stringify(msg);
    for (const client of wss.clients) {
        if (client.readyState === 1) {
            client.send(data);
        }
    }
}

async function loadInitialFiles(): Promise<void> {
    const entries = await fs.readdir(WATCHED_DIR);
    const sorted = entries.sort(compareStrings);

    for (const name of sorted) {
        const absPath = path.join(WATCHED_DIR, name);
        try {
            const record = await buildFileRecord(absPath);
            if (record) {
                files.set(record.name, record);
            }
        } catch {
            // ignore
        }
    }
}

async function upsertFromPath(absPath: string): Promise<void> {
    try {
        const record = await buildFileRecord(absPath);
        if (!record) return;
        files.set(record.name, record);
        broadcast({ type: "upsert", file: record });
    } catch {
        // ignore temporary file-write issues
    }
}

function removeFromPath(absPath: string): void {
    const name = path.basename(absPath);
    if (files.delete(name)) {
        broadcast({
            type: "remove",
            name: name,
        });
    }
}

async function main(): Promise<void> {
    await Promise.all([loadConfig(), ensureWatchedDir()]);
    await loadInitialFiles();

    wss.on("connection", (ws) => {
        const sortedFiles = [...files.values()].sort((a, b) =>
            compareStrings(a.title, b.title),
        );

        ws.send(
            JSON.stringify({
                type: "init",
                files: sortedFiles,
                config: CONFIG,
            } satisfies ServerMessage),
        );
    });

    const watcher = chokidar.watch(WATCHED_DIR, {
        ignoreInitial: true,
        awaitWriteFinish: {
            stabilityThreshold: 150,
            pollInterval: 50,
        },
    });

    watcher.on("add", upsertFromPath);
    watcher.on("change", upsertFromPath);
    watcher.on("unlink", removeFromPath);

    server.listen(PORT, () => {
        console.log(`Server running at http://localhost:${PORT}`);
        console.log(`Watching directory: ${WATCHED_DIR}`);
    });
}

main().catch((err) => {
    console.error(err);
    process.exit(1);
});
