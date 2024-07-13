import { Vector } from "../../Geometry/geometry.js";

class SketchRouteRenderer{
    constructor(app){
        this.routes = {};
        this.app = app;
    }

    reset(){
        this.routes = {};
        const app = this.app;

        Object.keys(this.routes).forEach(function(key){
            app.get(key, (req, res) => {
                // TODO: Send a list of registered sketches;
                res.send("There is no sketch at this route.");
            });

            app.post(key, (req, res) => {
                // TODO: Send message Sketch is no longer active
            });
        });
    }

    get_routes(){
        return Object.keys(this.routes);
    }

    add_route(route, svg, data){
        if (["/", "/pattern", "/reset", "/at_url"].concat(Object.keys(this.routes)).includes(route)){
            throw new Error(`Route ${route} is already taken!`);
        }

        let d = "<Data unserializable>";
        this.clean_rendering_data(data);
        try {
            d = this.clean_rendering_data(data);
        } catch {}

        this.routes[route] = {
            svg,
            data: d,
            live: false,
            route
        }

        this.app.get(route, (req, res) => {
            this.routes[route].live = true;
            res.render("at_url/sketch.ejs", this.routes[route]);
        });
        
        this.app.post(route, (req, res) => {
            if (this.routes[route].live) {
                return res.json({ live: true });
            }

            this.routes[route].live = true;
            res.json({ 
                live: false, 
                svg: this.routes[route].svg, 
                data: this.routes[route].data, 
            });
        });
    }

    clean_rendering_data(data){
        let nesting = 0;
        return nesting_buffer(data);

        function nesting_buffer(data){
            nesting++;
            if (nesting > 50){
                throw new Error("Can't create deep copy of data! (Nesting > " + 50 + ")");
            }

            // Basic Stuff
            if ([
                "undefined",
                "boolean",
                "number",
                "bigint",
                "string",
                "symbol"
            ].includes(typeof data)){
                nesting--;
                return data;
            }

            // Arrays
            if (data instanceof Array){
                nesting--;
                return data.map(nesting_buffer);
            }

            if (!data){
                return data;
            }

            // Basic dicts
            if (data.constructor === Object){
                const new_data = {};
                for (const key in data){
                    new_data[key] = nesting_buffer(data[key])
                }
                nesting--;
                return new_data;
            }

            // Vectors
            if (data instanceof Vector){
                nesting--;
                return `Vec: ${[data.x, data.y]}`;
            }

            return "[Object]"
        }
    }
}

export default (Sketch_dev, app) => {
    const SRR = new SketchRouteRenderer(app);
    Sketch_dev.at_url = function(url, data = null){
        SRR.add_route(url, this.to_dev_svg(500, 500), data);
    }

    app.get("/at_url", (req, res) => {
        res.render("at_url/at_url.ejs", {
            routes: SRR.get_routes()
        });
    });

    app.post("/at_url", (req, res) => {
        res.render('at_url/list.ejs', { routes: SRR.get_routes() });
    });

    return SRR;
}