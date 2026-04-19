import type { FileRecord } from "../../types.js";
import { renderCJsonFileCard } from "./cjson/index.js";
import { escapeHtml, json_to_string } from "./utilts.js";

export function renderFileCard(file: FileRecord): string {
    const meta = `
    <div class="meta">
      <div class="name">${escapeHtml(file.title)}</div>
    </div>
  `;

    let body = "";

    if (file.kind === "image") {
        body = `
      <div class="body image-body">
        <img src="${escapeHtml(file.url)}?t=${file.mtimeMs}" alt="${escapeHtml(file.title)}" />
      </div>
    `;
    } else if (file.kind === "svg") {
        body = `
      <div class="body svg-body">
            ${file.content!}
      </div>
    `;
    } else if (file.kind === "json") {
        body = `
      <div class="body">
        <pre class="json-block"><code class="language-json">${json_to_string(file.content)}</code></pre>
      </div>
    `;
    } else if (file.kind === "text") {
        body = `
      <div class="body">
        <pre class="text-block">${escapeHtml(String(file.content ?? ""))}</pre>
      </div>
    `;
    } else if (file.kind == "unknown") {
        body = `
      <div class="body">
        <a href="${escapeHtml(file.url)}" target="_blank" rel="noreferrer">
          Open file
        </a>
      </div>
    `;
    } else {
        return renderCJsonFileCard(file.content as any);
    }

    return `
    <article class="card" data-title="${escapeHtml(file.title)}">
      ${meta}
      ${body}
    </article>
  `;
}
