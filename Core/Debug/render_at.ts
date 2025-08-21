import Renderer from "../Sewing/rendering/renderer/index.js";
import type { Sketch } from "../StoffLib/sketch.js";
import { Sewing } from "../Sewing/sewing.js";
import { Request, Response } from "express";

import Route from "./route.js";
export function at_url(s: Sketch | Sewing | Sketch[], url: `/${string}`, overwrite: boolean | null = null) {
    const get = new Route(url, "GET", overwrite as any);
    const post = new Route(url, "POST", overwrite as any);

    let hot_reload_timestamps: string[] = [];

    const to_render = s instanceof Sewing ? s : Array.isArray(s) ? s.map(s => s.copy()) : s.copy();
    get.request = function (req: Request, res: Response) {
        return res.render("hot", {
            path: `${url}`,
        });
    }

    post.request = function (req: Request, res: Response) {
        const state = JSON.parse(req.body.application_state);
        if (hot_reload_timestamps.includes(state.start_ts)) {
            return res.send("");
        }

        hot_reload_timestamps.push(Date.now().toString());
        state.start_ts =
            hot_reload_timestamps[hot_reload_timestamps.length - 1];

        try {
            res.render("htmx/hot_reload_res", {
                state,
                to_render: to_render,
                RenderClass: Renderer,
                render_type: to_render instanceof Sewing ? "sewing" : Array.isArray(to_render) ? "sketch_array" : "sketch",
                error: false,
            });
        } catch (error: any) {
            res.render("htmx/hot_reload_res", {
                state,
                error: true,
                msg: error.stack || error.toString(),
            });
        }
    };
};

export function hot_at_url(s: Sketch | Sewing | Sketch[], url: `/${string}`, overwrite: boolean | null = null, data = null) {
    const get = new Route(url, "GET", overwrite as any);
    const post = new Route(url, "POST", overwrite as any);

    let hot_reload_timestamps: string[] = [];

    get.request = function (req: Request, res: Response) {
        return res.render("hot", {
            path: `${url}`,
        });
    }

    post.request = function (req: Request, res: Response) {
        const state = JSON.parse(req.body.application_state);
        if (hot_reload_timestamps.includes(state.start_ts)) {
            return res.send("");
        }

        hot_reload_timestamps.push(Date.now().toString());
        state.start_ts =
            hot_reload_timestamps[hot_reload_timestamps.length - 1];

        try {
            res.render("htmx/hot_reload_res", {
                state,
                to_render: s,
                RenderClass: Renderer,
                render_type: s instanceof Sewing ? "sewing" : Array.isArray(s) ? "sketch_array" : "sketch",
                error: false,
            });
        } catch (error: any) {
            res.render("htmx/hot_reload_res", {
                state,
                error: true,
                msg: error.stack || error.toString(),
            });
        }
    };
};
