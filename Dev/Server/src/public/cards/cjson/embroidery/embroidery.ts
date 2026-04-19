import { Color, Polyline, Vector } from "@/Core";
import { Embroidery } from "../../../../../../../Embroidery/Lib/embroidery";
import { CJson } from "../../../../types.js";
import { update_embroidery_image } from "./canvas.js";

export function render_embroidery(
    data: CJson & {
        type: "embroidery";
    },
): string {
    const str = JSON.stringify(data.value).replaceAll('"', "&quot;");

    return `
      <div class="body embroidery" x-data="${str}"
>
        <div class="slider-section">
            <input type="range" 
             class="slider" 
             min="0" 
             max="0" 
             value="0"
>
            <div class="slider-play slider_is_pause"><span class="slider_is_pause_icon">&#9654</span><span class="slider_is_play_icon">&#9208</span></div>
        </div>
        <div class="embroidery-img-section"><canvas width="500" height="500"></canvas></div>
      </div>
    `;
}

export type Threads = {
    color: string;
    runs: [number, number][][];
}[];

export type EmbroideryData = {
    root: HTMLDivElement;
    canvas: HTMLCanvasElement;
    embr: Embroidery;
    current_stitch_index: number;
    slider: HTMLInputElement;
    toggle_btn: HTMLDivElement;
    auto_increment_interval: number | null;
};

let embroideries: EmbroideryData[] = [];

export function recomputeEmbroideryDisplay() {
    const newEmbr = Array.from(
        document.getElementsByClassName("embroidery"),
    ) as HTMLDivElement[];

    embroideries.forEach(stop_auto_increment);
    embroideries = newEmbr.map((e) => set_up_embroidery(e));
}

function set_up_embroidery(e: HTMLDivElement): EmbroideryData {
    const threads: Threads = JSON.parse(e.getAttribute("x-data")!)!;
    const slider = e.getElementsByTagName("input")[0]!;
    const toggle_btn = e.getElementsByClassName(
        "slider-play",
    )[0]! as HTMLDivElement;

    const embr: EmbroideryData = {
        root: e,
        canvas: e.getElementsByTagName("canvas")[0]!,
        embr: new Embroidery(
            threads.map((t) => {
                return {
                    color: t.color as Color.Color,
                    runs: t.runs.map(
                        (r) =>
                            new Polyline(r.map(([x, y]) => new Vector(x, y))),
                    ),
                };
            }),
        ),
        current_stitch_index: -1,
        slider,
        toggle_btn,
        auto_increment_interval: null,
    };

    const max_index = Math.max(0, embr.embr.stitch_count() - 1);

    slider.min = "0";
    slider.max = String(max_index);
    slider.value = String(max_index);

    slider.oninput = () => {
        stop_auto_increment(embr);
        update_embroidery_image(embr, slider.valueAsNumber);
    };

    toggle_btn.onclick = () => {
        if (slider.valueAsNumber >= max_index) {
            toggle_btn.classList.add("slider_is_pause");
            return;
        }

        const is_pause = toggle_btn.classList.toggle("slider_is_pause");

        if (is_pause) {
            stop_auto_increment(embr);
            return;
        }

        start_auto_increment(embr);
    };

    update_embroidery_image(embr, max_index);

    return embr;
}

function start_auto_increment(e: EmbroideryData) {
    stop_auto_increment(e);

    const max_index = Number(e.slider.max);

    e.auto_increment_interval = window.setInterval(() => {
        const current = e.slider.valueAsNumber;
        const next = current + 1;
        if (next >= max_index) {
            stop_auto_increment(e);
            e.toggle_btn.classList.add("slider_is_pause");
        }

        e.slider.value = String(next);
        update_embroidery_image(e, next);
    }, 10);
}

function stop_auto_increment(e: EmbroideryData) {
    if (e.auto_increment_interval !== null) {
        window.clearInterval(e.auto_increment_interval);
        e.auto_increment_interval = null;
    }
}
