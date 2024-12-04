import WEBSITE_CONF from "../../config.json" assert { type: 'json' };

export default (req, res) => {
    req.event_emitter.emit("page_not_found", {
        event_source: "website",
        type: "error",
        internal: false,
        path: req.originalUrl
    });
    
    if (WEBSITE_CONF.is_publish){
        const isRouteRegistered = req.app._router.stack.some(
            (layer) => layer.route?.path === '/notfound' && layer.route?.methods?.get
        );

        if (isRouteRegistered) {
            return res.status(404).redirect("/notfound");
        }
        return res.status(404).send("not found");
    }
    return res.sendStatus(404);
}