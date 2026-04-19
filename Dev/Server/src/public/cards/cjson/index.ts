import { CJson } from "../../../types.js";
import { escapeHtml, json_to_string } from "../utilts.js";
import { render_embroidery } from "./embroidery/embroidery.js";
import { render_recording } from "./recordings.js";

export function renderCJsonFileCard(data: CJson): string {
    let body = "";
    if (data.type == "svg") {
        body = `
      <div class="body svg-body">
        ${data.value}
      </div>
    `;
    } else if (data.type === "json") {
        body = `
      <div class="body">
        <pre class="json-block"><code class="language-json">${json_to_string(data.value)}</code></pre>
      </div>
    `;
    } else if (data.type === "text") {
        body = `
      <div class="body">
        <pre class="text-block">${escapeHtml(data.value)}</pre>
      </div>
    `;
    } else if (data.type == "error") {
        body = `
      <div class="body error">
        <pre class="json-block"><code class="language-json">${escapeHtml(data.value.stack)}</code></pre>
      </div>
    `;
    } else if (data.type == "failedTest") {
        const rendered = data.value.map((t) => {
            return `<div class="failed-test-row"><span class="test-name">${t.test}</span><span class="test-sep"> | </span><span class="failureReason">${t.reason.type}</span></div>`;
        });

        body = `
      <div class="body failedTest">
        ${rendered.join("")}
      </div>
    `;
    } else if (data.type == "recording") {
        body = render_recording(data);
    } else {
        body = render_embroidery(data);
    }

    return `
    <article class="card cjson" data-title="${escapeHtml(data.title)}">
      <div class="meta"
          onclick="this.parentElement.classList.toggle('show-trace')">
        <div class="name">${escapeHtml(data.title)}</div>
        <div
            class="toggleBtn"
        >
            &#x2699
        </div>
      </div>
${body}
      <div class="trace">
        <pre class="json-block"><code class="language-json">${escapeHtml(data.stack)}</code></pre>
      </div>
    </article>
  `;
}
