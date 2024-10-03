export default (Sketch, app) => {
    if (!Sketch.dev) throw new Error("Sketch Dev was not initialized");

    const routes = [];

    Sketch.dev._serve_html = function (url, html){
        routes.push(url);
        app.get(url, (req, res) => {
            res.send(html);
        });
    }

    Sketch.dev._depricated_html_served_at = function (route){
        routes.push(route);
    }

    app.get("/at_url", (req, res) => {
        res.render("at_url/at_url.ejs", {
            routes
        });
    });

    app.post("/at_url", (req, res) => {
        res.render('at_url/list.ejs', { routes });
    });
}