import { compareStrings } from "../compareStrings.js";
import { renderFileCard } from "../fileProcessor.js";
import type { Config, FileRecord, ServerMessage } from "../types.js";

const grid = document.getElementById("grid") as HTMLDivElement;
// @ts-ignore
const statusEl = document.getElementById("status") as HTMLDivElement;

// @ts-ignore
const cards = new Map<string, HTMLElement>();

// @ts-ignore
function insertCardSorted(el: HTMLElement, title: string): void {
    // @ts-ignore
    const children = Array.from(grid.children) as HTMLElement[];

    for (const child of children) {
        const childTitle = child.dataset.title ?? "";
        if (compareStrings(title, childTitle) < 0) {
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
        insertCardSorted(fresh, file.title);
        return;
    }

    cards.set(file.name, fresh);
    insertCardSorted(fresh, file.title);
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
                compareStrings(a.title, b.title),
            );
            for (const file of sorted) {
                upsertFile(file);
            }
            reHighlight();
            return;
        }

        if (msg.type === "upsert") {
            upsertFile(msg.file);

            if (msg.file.kind == "json") {
                reHighlight();
            } else if (msg.file.kind == "svg") {
            } else if (msg.file.kind == "cjson") {
                reHighlight();
                // @ts-ignore
                globalThis.rebuildRenderGroups();
            }
            return;
        }

        if (msg.type === "remove") {
            removeFile(msg.name);
        }
    });
}

function reHighlight() {
    document.querySelectorAll("pre code").forEach((el) => {
        if (!el.classList.contains("hljs")) {
            // @ts-ignore
            (hljs as any).highlightElement(el);
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
