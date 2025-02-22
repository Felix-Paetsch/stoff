export default (Sketch, app) => {
    if (!Sketch.dev) throw new Error("Sketch Dev was not initialized");

    const routes = [];
    Sketch.dev._register_route = function (route) {

        if (["/", "/pattern", "/reset", "/at_url", "/self_intersects"].includes(route.url)){
            if (route.overwrite === false){
                return;
            } else {
                throw new Error("Route '" + route.url + "' already exists!");
            }
        }

        let foundIndex = -1;
        for (let i = 0; i < routes.length; i++) {
            if (routes[i].url === route.url && routes[i].method === route.method) {
                foundIndex = i;
                break;
            }
        }
    
        if (foundIndex !== -1) {
            if (route.overwrite) {
                routes.splice(foundIndex, 1);
            } else {
                throw new Error("Route '" + route.url + "' already exists!");
            }
        }
    
        routes.push(route);
    };

    Sketch.dev._reset_routes = function () {
        routes.length = 0;
    }

    app.use((req, res, next) => {
        const route = routes.find(r => r.url === req.url && r.method === req.method);
    
        if (route) {
            res.send(route.request(req));
        } else {
            next();
        }
    });

    Sketch.dev._serve_get = function (url, html){
        if (!overwrite && ["/", "/pattern", "/reset", "/at_url", "/self_intersects"].concat(routes).includes(url)){
            throw new Error(`Route ${url} is already taken!`);
        }

        routes.push(url);
        app.get(url, (req, res) => {
            res.send(html);
        });
    }

    app.get("/at_url", (req, res) => {
        res.render("at_url/at_url.ejs", {
            routes: routes.filter(route => route.method == "GET").map(route => route.url)
        });
    });

    app.post("/at_url", (req, res) => {
        res.render('at_url/list.ejs', { 
            routes: routes.filter(route => route.method == "POST").map(route => route.url)
        });
    });
}