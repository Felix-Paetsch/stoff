import type { CJson, FileRecord } from "./types.js";

function escapeHtml(value: string): string {
    return value
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#39;");
}

function json_to_string(data: unknown): string {
    try {
        const json = JSON.stringify(data, null, 2);
        const s = escapeHtml(json);
        return s;
    } catch {
        return "" + (data as any);
    }
}

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
    } else {
        const svg_map_fn = (
            d: (typeof data)["value"][number],
            i: number,
        ): string => {
            return `
                <div ${i == 0 ? "" : 'style="display:none"'} class="svg-body">${d.svg}</div>
            `;
        };

        const trace_map_fn = (
            d: (typeof data)["value"][number],
            i: number,
        ): string => {
            return `
      <div class="trace" ${i == 0 ? 'style="display:block"' : 'style="display:none"'} >
        <pre class="json-block"><code class="language-json">${escapeHtml(d.stack)}</code></pre>
      </div>
            `;
        };

        data.value;
        body = `
      <div class="body recording">
        <div class="slider-section">
            <input type="range" 
             class="slider" 
             min="1" 
             max="${data.value.length}" 
             value="1"
            oninput="on_recording_value_changed(this)"
>
            <div class="slider-value"><span class="sliderCurrentValue">${data.value.length == 0 ? "0" : "1"}</span>/<span>${data.value.length}</span></div>
        </div>
        <div class="svg-section">${data.value.map(svg_map_fn).join("")}</div>
        <div class="trace-section" onclick="this.parentElement.parentElement.classList.toggle('expanded-traces')">${data.value.map(trace_map_fn).join("")}</div>
      </div>
    `;
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

(globalThis as any).on_recording_value_changed =
    function on_recording_value_changed(r: any) {
        const value = r.value;
        const p = r.parentElement.parentElement;
        p.querySelector(".sliderCurrentValue").innerHTML = value;
        const svgChildren = p.querySelectorAll(".svg-section .svg-body");
        for (let i = 0; i < svgChildren.length; i++) {
            if (i == value - 1) {
                svgChildren[i].style.display = "block";
            } else {
                svgChildren[i].style.display = "none";
            }
        }

        const traceChildren = p.querySelectorAll(".trace-section .trace");
        for (let i = 0; i < traceChildren.length; i++) {
            if (i == value - 1) {
                traceChildren[i].style.display = "block";
            } else {
                traceChildren[i].style.display = "none";
            }
        }
    };
