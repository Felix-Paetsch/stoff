import { CJson } from "../../../types.js";
import { escapeHtml } from "../utilts.js";

export function render_recording(
    data: CJson & {
        type: "recording";
    },
) {
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
    return `
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
