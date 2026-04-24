import { Embroidery } from "Embroidery/Lib/embroidery";
import { writeFileSync } from "fs";
import * as path from "path";
import {
    DST,
    Json,
    render_sketch,
    Sketch,
    SVG_Builder,
    Utils,
} from "../../../Core/index";
import { CJson } from "../../Server/src/types";
import { Recording } from "../index";
import { dir } from "./index";

export type Putable =
    | Sketch
    | Json
    | Recording.Recording
    | string
    | SVG_Builder
    | Error
    | Embroidery
    | DST;
export type PutMetaData = {
    title?: string;
    prefix?: boolean;
    stack?: string;
};

export const live_recordings: {
    what: Recording.Recording;
    meta: PutMetaData;
}[] = [];

export function put(what: Putable, meta?: PutMetaData | string) {
    if (typeof meta == "string") {
        meta = { title: meta, prefix: false };
    }

    if (!meta) {
        meta = {};
    }
    if (!meta.stack) {
        meta.stack = Utils.stack_trace(1);
    }

    if (what instanceof Recording.Recording && what.is_hot) {
        live_recordings.push({
            what,
            meta,
        });
        return;
    }
    const d = dir();
    const cjson: CJson = {
        ...serialize_put(what),
        ...serialize_meta_data(meta || {}),
    };

    const as_string = JSON.stringify(cjson);
    writeFileSync(path.join(d, Utils.unique_string() + ".cjson"), as_string);
}

export function put_live_recordings() {
    live_recordings.forEach((rec) => {
        rec.what.is_hot = false;
        put(rec.what, rec.meta);
    });
    live_recordings.length = 0;
}

const gen_int = Utils.unique_int_gen();
export function prefix(s: string): string {
    return "" + gen_int() + "_" + s;
}

function serialize_meta_data(meta: PutMetaData) {
    let title = meta.title ?? "stoff";
    if (meta.prefix !== false) {
        title = prefix(title);
    }
    return {
        title,
        stack: meta.stack!,
    } as const;
}

function serialize_put(what: Putable) {
    if (typeof what == "string") {
        return {
            type: "text",
            value: what,
        } as const;
    }

    if (what instanceof Sketch) {
        return serialize_put(
            render_sketch(what, {
                width: 500,
                height: 500,
                padding: 30,
                debug: true,
            }),
        );
    }

    if (what instanceof SVG_Builder) {
        return {
            type: "svg",
            value: what.svg(),
        } as const;
    }

    if (what instanceof Recording.Recording) {
        return {
            type: "recording" as const,
            value: what.snapshots.map((s) => {
                return {
                    svg: render_sketch(s.sketch, {
                        width: 500,
                        height: 500,
                        padding: 30,
                        debug: true,
                    }).svg(),
                    stack: s.stackTrace,
                };
            }),
        };
    }

    if (what instanceof Error) {
        return {
            type: "error" as const,
            value: {
                name: what.name,
                stack: what.stack || "<no stack trace available>",
            },
        };
    }

    if (what instanceof DST){
        what = Embroidery.from_dst(what);
    }

    if (what instanceof Embroidery) {
        return {
            type: "embroidery" as const,
            value: what.threads.map((t) => {
                return {
                    color: t.color,
                    runs: t.runs.map((r) =>
                        r.vertices.map((v) => v.to_array()),
                    ),
                };
            }),
        };
    }

    return {
        type: "json" as const,
        value: what,
    };
}
