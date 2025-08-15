export default (Sketch, app) => {
    if (!Sketch.dev) throw new Error("Sketch Dev was not initialized");

    const routes = [];
    Sketch.dev._register_route = function (route) {
        let foundIndex = -1;
        for (let i = 0; i < routes.length; i++) {
            if (
                routes[i].url === route.url &&
                routes[i].method === route.method
            ) {
                foundIndex = i;
                break;
            }
        }

        if (foundIndex !== -1) {
            if (route.overwrite) {
                routes.splice(foundIndex, 1);
            } else if (route.overwrite === null) {
                return;
            } else {
                throw new Error("Route '" + route.url + "' already exists!");
            }
        }

        routes.push(route);
    };

    Sketch.dev._reset_routes = function () {
        routes.length = 0;
    };

    app.use((req, res, next) => {
        const route = routes.find(
            (r) => r.url === req.url && r.method === req.method
        );

        if (route) {
            route.request(req, res);
        } else {
            next();
        }
    });
};
