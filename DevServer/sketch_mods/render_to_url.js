class SketchRouteRenderer{
    constructor(app){
        this.routes = {};
        this.app = app;
    }

    reset(){
        Object.keys(this.routes).forEach(function(key){
            this.app.get(key, (req, res) => {
                // TODO: Send a list of registered sketches;
                res.send("There is no sketch at this route.");
            });

            this.app.post(key, (req, res) => {
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
            svg: svg,
            live: false
        }

        this.app.get(route, (req, res) => {
            // TODO: Send correct ejs
            res.send("Route registerd");
        });
        
        this.app.post(route, (req, res) => {
            this.routes[route].live = true;
            // TODO: Send correct data
            res.send("Route registerd");
        });
    }
}

export default (Sketch_dev, app) => {
    const SRR = new SketchRouteRenderer(app);
    Sketch_dev.at_url = function(url, data = null){
        SSR.add_route(url, this.to_dev_svg(500, 500), data);
    }

    app.get("/at_url", (req, res) => {
        // TODO.
        res.send("Wha");
    });

    return SRR;
}