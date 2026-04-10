import { renderFileCard } from "../fileProcessor.js";
import type { FileRecord, ServerMessage } from "../types.js";

const grid = document.getElementById("grid") as HTMLDivElement;
const statusEl = document.getElementById("status") as HTMLDivElement;

const cards = new Map<string, HTMLElement>();

function compareNames(a: string, b: string): number {
    return a.localeCompare(b, undefined, {
        numeric: true,
        sensitivity: "base",
    });
}

function insertCardSorted(el: HTMLElement, name: string): void {
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

function createCard(file: FileRecord): HTMLElement {
    const wrapper = document.createElement("div");
    wrapper.innerHTML = renderFileCard(file).trim();
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
    const protocol = location.protocol === "https:" ? "wss:" : "ws:";
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
            grid.innerHTML = "";
            cards.clear();

            const sorted = [...msg.files].sort((a, b) =>
                compareNames(a.name, b.name),
            );
            for (const file of sorted) {
                upsertFile(file);
            }
            return;
        }

        if (msg.type === "upsert") {
            upsertFile(msg.file);
            return;
        }

        if (msg.type === "remove") {
            removeFile(msg.name);
        }
    });
}

connect();
