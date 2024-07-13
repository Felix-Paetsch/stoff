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

        this.routes[route] = {
            svg,
            data,
            live: false,
            route
        }

        this.app.get(route, (req, res) => {
            this.routes[route].live = true;
            res.render("at_url/sketch.ejs", this.routes[route]);
        });
        
        this.app.post(route, (req, res) => {
            if (this.routes[route].live){
                return res.send("true");
            }

            this.routes[route].live = true;
            res.send(this.routes[route].svg);
        });
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