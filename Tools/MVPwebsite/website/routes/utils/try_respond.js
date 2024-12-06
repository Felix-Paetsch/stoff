export default function try_respond(DATA, fun) {
    return async (req, res) => {
        try {
            return {
                error: false,
                result: await fun(req, res)
            }
        } catch (err) {
            res.status(500).redirect("/server_error");
            req.event_emitter.emit("website_server_error", {
                event_source: "website",
                type: "error",
                error: err,
                internal: true
            });
            return {
                error: true,
                result: err
            }
        }
    }
}