import { renderFileCard } from "../fileProcessor.js";
import type { Config, FileRecord, ServerMessage } from "../types.js";

const grid = document.getElementById("grid") as HTMLDivElement;
// @ts-ignore
const statusEl = document.getElementById("status") as HTMLDivElement;

// @ts-ignore
const cards = new Map<string, HTMLElement>();

function compareNames(a: string, b: string): number {
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

// @ts-ignore
function insertCardSorted(el: HTMLElement, name: string): void {
    // @ts-ignore
    const children = Array.from(grid.children) as HTMLElement[];

    for (const child of children) {
        const childName = child.dataset.name ?? "";
        if (compareNames(name, childName) < 0) {
            grid.insertBefore(el, child);
            return;
        }
    }

    grid.appendChild(el);
}

// @ts-ignore
function createCard(file: FileRecord): HTMLElement {
    // @ts-ignore
    const wrapper = document.createElement("div");
    wrapper.innerHTML = renderFileCard(file).trim();
    // @ts-ignore
    return wrapper.firstElementChild as HTMLElement;
}

function upsertFile(file: FileRecord): void {
    const existing = cards.get(file.name);
    const fresh = createCard(file);

    if (existing) {
        existing.replaceWith(fresh);
        cards.set(file.name, fresh);
        fresh.remove();
        insertCardSorted(fresh, file.name);
        return;
    }

    cards.set(file.name, fresh);
    insertCardSorted(fresh, file.name);
}

function removeFile(name: string): void {
    const existing = cards.get(name);
    if (!existing) return;
    existing.remove();
    cards.delete(name);
}

function setStatus(text: string): void {
    statusEl.textContent = text;
}

function connect(): void {
    // @ts-ignore
    const protocol = location.protocol === "https:" ? "wss:" : "ws:";
    // @ts-ignore
    const ws = new WebSocket(`${protocol}//${location.host}`);

    ws.addEventListener("open", () => {
        setStatus("Connected");
    });

    ws.addEventListener("close", () => {
        setStatus("Disconnected, retrying…");
        setTimeout(connect, 1000);
    });

    ws.addEventListener("message", (event) => {
        const msg = JSON.parse(event.data) as ServerMessage;

        if (msg.type === "init") {
            applyConfig(msg.config);

            grid.innerHTML = "";
            cards.clear();

            const sorted = [...msg.files].sort((a, b) =>
                compareNames(a.name, b.name),
            );
            for (const file of sorted) {
                upsertFile(file);
            }
            // @ts-ignore
            (hljs as any)?.highlightAll();
            return;
        }

        if (msg.type === "upsert") {
            upsertFile(msg.file);

            if (msg.file.kind == "json") {
                // @ts-ignore
                (hljs as any)?.highlightAll();
            }
            return;
        }

        if (msg.type === "remove") {
            removeFile(msg.name);
        }
    });
}

function applyConfig(cfg: Config): void {
    cfg.cardWidth &&
        // @ts-ignore
        document.documentElement.style.setProperty(
            "--cardWidth",
            `${cfg.cardWidth}px`,
        );
    cfg.cardMinHeight &&
        // @ts-ignore
        document.documentElement.style.setProperty(
            "--cardMinHeight",
            `${cfg.cardMinHeight}px`,
        );
    cfg.cardMaxHeight &&
        // @ts-ignore
        document.documentElement.style.setProperty(
            "--cardMaxHeight",
            `${cfg.cardMaxHeight}px`,
        );
}

connect();
