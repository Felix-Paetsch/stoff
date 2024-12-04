import WEBSITE_CONF from "../../config.json" assert { type: 'json' };

export default(app) => {
    if (WEBSITE_CONF.is_publish || !WEBSITE_CONF.hot_reload) {
        return;
    }

    let already_visited = false;
    let routes_requested = [];

    app.post("/hot_reload", (req, res) => {
        if (req.params.request_ident){
            if (routes_requested.includes(req.params.request_ident)){
                return res.json(false);
            } else {
                routes_requested.push(req.params.request_ident);
                already_visited = true;
                return res.json(true);
            }
        }

        if (already_visited) {
            return res.json(false);
        }

        already_visited = true;
        return res.json(true);
    });
}