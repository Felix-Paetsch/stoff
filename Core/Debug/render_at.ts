import Renderer from "../Sewing/rendering/renderer/index.js";
import Sketch from "../StoffLib/sketch.js";
import { Sewing } from "../Sewing/sewing.js";
import { Request, Response } from "express";

import Route from "../StoffLib/dev/sketch_dev/request_routing.js";
export default (s: Sketch | Sewing, url: `/${string}`, overwrite: boolean | null = null) => {
    const get = new Route(url, "get", overwrite as any);
    const post = new Route(url, "post", overwrite as any);

    let hot_reload_timestamps: string[] = [];

    const to_render = s instanceof Sketch ? s.copy() : s;
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
                render_type: to_render instanceof Sketch ? "sketch" : "sewing",
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

/*
Sketch.dev.hot_at_url = function (url, overwrite = null, data = null) {
        const get = new Route(url, "get", overwrite);
        const post = new Route(url, "post", overwrite);

        let current_ts = Date.now();
        const state = this.copy();
        const route_data = {
            data: clean_rendering_data(data),
            route: url,
            type: "snapshot",
            sketch_data: clean_rendering_data(state.data),
        };

        get.request = function () {
            return state.dev.to_html(url, data);
        }.bind(this);

        const to_dev_svg = () => {
            return this.to_dev_svg(500, 500);
        };

        post.request = function (req) {
            if (Date.now() - current_ts > 15000) {
                current_ts = Date.now();
            }
            if (current_ts == req.body.ts) {
                return {
                    ts: current_ts,
                    live: true,
                    type: "snapshot",
                };
            }

            route_data.live = true;
            return {
                ...route_data,
                ts: current_ts,
                svg: to_dev_svg(),
                live: false,
            };
        };
    };
    */
