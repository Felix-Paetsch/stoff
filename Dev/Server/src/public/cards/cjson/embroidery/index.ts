import { CJson } from "../../../../types.js";
import { update_embroidery_image } from "./canvas.js";

export function render_embroidery(
    data: CJson & {
        type: "embroidery";
    },
): string {
    const str = JSON.stringify(data.value).replaceAll('"', "&quot;");

    return `
      <div class="body embroidery" x-data="${str}">
        <div class="slider-section">
            <input type="range"
             class="slider"
             min="1"
             max="1"
             value="1">
            <div class="slider-play slider_is_pause"><span class="slider_is_pause_icon">&#9654</span><span class="slider_is_play_icon">&#9208</span></div>
            <div class="slider-speed">x1</div>
        </div>
        <div class="embroidery-img-section"><canvas width="500" height="500"></canvas></div>
      </div>
    `;
}

export type Threads = {
    color: string;
    runs: [number, number][][];
}[];

const SPEED_MULTIPLIERS = [0.5, 1, 4, 8] as const;

export type EmbroideryData = {
    root: HTMLDivElement;
    canvas: HTMLCanvasElement;
    threads: Threads;
    current_stitch_index: number;
    slider: HTMLInputElement;
    toggle_btn: HTMLDivElement;
    speed_btn: HTMLDivElement;
    speed_multiplier: (typeof SPEED_MULTIPLIERS)[number];
    auto_increment_interval: number | null;
};

let embroideries: EmbroideryData[] = [];

const BASE_INTERVAL_MS = 60;

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
    const speed_btn = e.getElementsByClassName(
        "slider-speed",
    )[0]! as HTMLDivElement;

    const embr: EmbroideryData = {
        root: e,
        canvas: e.getElementsByTagName("canvas")[0]!,
        threads,
        current_stitch_index: 0,
        slider,
        toggle_btn,
        speed_btn,
        speed_multiplier: 1,
        auto_increment_interval: null,
    };

    const max_index = Math.max(0, calculate_stitch_count(threads) - 1);

    slider.min = "1";
    slider.max = String(max_index);
    slider.value = String(max_index);

    speed_btn.textContent = `x${embr.speed_multiplier}`;

    slider.oninput = () => {
        stop_auto_increment(embr);
        update_embroidery_image(embr, slider.valueAsNumber);
    };

    function toggle_play() {
        const is_pause = toggle_btn.classList.toggle("slider_is_pause");

        if (is_pause) {
            stop_auto_increment(embr);
            return;
        }

        if (slider.valueAsNumber >= max_index) {
            slider.value = "0";
        }

        start_auto_increment(embr);
    }

    slider.addEventListener("keydown", (event) => {
        if (event.key === " ") {
            event.preventDefault();
            toggle_play();
        }
    });

    toggle_btn.onclick = toggle_play;

    speed_btn.onclick = () => {
        const current_index = SPEED_MULTIPLIERS.indexOf(embr.speed_multiplier);
        const next_index = (current_index + 1) % SPEED_MULTIPLIERS.length;
        embr.speed_multiplier = SPEED_MULTIPLIERS[next_index];
        speed_btn.textContent = `x${embr.speed_multiplier}`;
    };

    update_embroidery_image(embr, max_index);

    return embr;
}

function start_auto_increment(e: EmbroideryData) {
    stop_auto_increment(e);
    e.toggle_btn.classList.remove("slider_is_pause");

    const max_index = Number(e.slider.max);

    e.auto_increment_interval = window.setInterval(() => {
        const current = e.slider.valueAsNumber;
        const stitches_per_tick = e.speed_multiplier * 2;
        const next = Math.min(current + stitches_per_tick, max_index);

        e.slider.value = String(next);
        update_embroidery_image(e, next);

        if (next >= max_index) {
            stop_auto_increment(e);
            e.toggle_btn.classList.add("slider_is_pause");
        }
    }, BASE_INTERVAL_MS);
}

function stop_auto_increment(e: EmbroideryData) {
    if (e.auto_increment_interval !== null) {
        window.clearInterval(e.auto_increment_interval);
        e.auto_increment_interval = null;
    }

    e.toggle_btn.classList.add("slider_is_pause");
}

function calculate_stitch_count(threads: Threads): number {
    let res = 0;
    for (const t of threads) {
        for (const r of t.runs) {
            res += r.length + 1;
        }
    }

    return res;
}
