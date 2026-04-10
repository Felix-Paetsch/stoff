import type { FileRecord } from "./types.js";

function escapeHtml(value: string): string {
    return value
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#39;");
}

function prettyJson(data: unknown): string {
    return escapeHtml(JSON.stringify(data, null, 2));
}

export function renderFileCard(file: FileRecord): string {
    const meta = `
    <div class="meta">
      <div class="name">${escapeHtml(file.name)}</div>
      <div class="sub">
        <span>${escapeHtml(file.kind)}</span>
        <span>${file.size} bytes</span>
      </div>
    </div>
  `;

    let body = "";

    if (file.kind === "image") {
        body = `
      <div class="body image-body">
        <img src="${escapeHtml(file.url)}?t=${file.mtimeMs}" alt="${escapeHtml(file.name)}" />
      </div>
    `;
    } else if (file.kind === "json") {
        body = `
      <div class="body">
        <pre>${prettyJson(file.content)}</pre>
      </div>
    `;
    } else if (file.kind === "text") {
        body = `
      <div class="body">
        <pre>${escapeHtml(String(file.content ?? ""))}</pre>
      </div>
    `;
    } else {
        body = `
      <div class="body">
        <a href="${escapeHtml(file.url)}" target="_blank" rel="noreferrer">
          Open file
        </a>
      </div>
    `;
    }

    return `
    <article class="card" data-name="${escapeHtml(file.name)}">
      ${meta}
      ${body}
    </article>
  `;
}
