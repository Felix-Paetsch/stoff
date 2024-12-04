export default (app) => {
    app.use((err, req, res, next) => {
        return next();
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