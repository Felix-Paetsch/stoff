import WEBSITE_CONF from "../config.json" with {type: "json"};

export default (app) => {
    app.use((err, req, res, next) => {
        if (!WEBSITE_CONF.is_publish && WEBSITE_CONF.throw_on_server_error){
            throw err;
        }

        req.event_manager.emit("middleware_error", {
            event_source: "website",
            type: "error",
            error: err,
            internal: true,
            req
        });

        return res.status(500).redirect("/server_error");
    });
}