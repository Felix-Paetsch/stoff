import { writeFileSync } from "fs";
import { dirname } from "path";
import load_assets from './tools/load_assets.js';
import ejs from 'ejs';

import clean_rendering_data from "./tools/clean_rendering_data.js";
import Route from "./request_routing.js";

export default (Sketch) => {
    Sketch.dev.to_html = function(route = "/StoffLib", data = null){
        const route_data = {
            svg: this.to_dev_svg(500, 500),
            data: clean_rendering_data(data),
            route,
            sketch_data: clean_rendering_data(this.data)
        };

        const assets = load_assets(
            "./DevEnv/DevServer",
            [
                "public/at_url/sketch.css",
                "views/at_url/sketch.ejs",
                "public/main/add_svg_hover_events.js"
            ]
        );

        const htmlOutput = ejs.render(assets["sketch.ejs"], {
            ...route_data,
            assets
        }, {
            root: dirname("../../../../DevServer/at_url")
        });

        return htmlOutput;
    }

    // Make a bit more independent of DevServer
    const old_to_html = Sketch.dev.to_html;
    Sketch.dev.to_html = function (...args){
        try {
            return old_to_html.bind(this)(...args);
        } catch (e) {
            throw e;
            throw new Error("Can't find assets. Perhaps DevServer is not connected!");
        }
    }

    Sketch.dev.save_as_html = function(path, title = "/StoffLib", data = null){
        writeFileSync(path, this.dev.to_html(title, data), 'utf-8');
    }

    Sketch.dev.at_url = function(url, overwrite = null, data = null){
        const get  = new Route(url, "get",  overwrite);
        const post = new Route(url, "post", overwrite);

        const current_ts = Date.now();

        const state = this.copy();
        const route_data = {
            svg: this.to_dev_svg(500, 500),
            data: clean_rendering_data(data),
            ts: current_ts,
            route: url,
            type: "snapshot",
            sketch_data: clean_rendering_data(state.data)
        };

        get.request = (function(){
            return state.dev.to_html(url, data);
        }).bind(this);

        post.request = function(req){
            if (current_ts == req.body.ts) {
                return { 
                    ts: current_ts,
                    live: true,
                    type: "snapshot"
                };
            }

            route_data.live = true;
            return {
                ...route_data,
                live: false
            };
        }
    }

    Sketch.dev.hot_at_url = function(url, overwrite = null, data = null){
        const get  = new Route(url, "get",  overwrite);
        const post = new Route(url, "post", overwrite);

        let current_ts = Date.now();
        const state = this.copy();
        const route_data = {
            data: clean_rendering_data(data),
            route: url,
            type: "snapshot",
            sketch_data: clean_rendering_data(state.data)
        };

        get.request = (function(){
            return state.dev.to_html(url, data);
        }).bind(this);

        const to_dev_svg = () => {
            return this.to_dev_svg(500,500);
        }

        post.request = function(req){
            if (Date.now() - current_ts > 15000){
                current_ts = Date.now();
            }
            if (current_ts == req.body.ts) {
                return { 
                    ts: current_ts,
                    live: true,
                    type: "snapshot"
                };
            }

            route_data.live = true;
            return {
                ...route_data,
                ts: current_ts,
                svg: to_dev_svg(),
                live: false
            };
        }
    }
}
