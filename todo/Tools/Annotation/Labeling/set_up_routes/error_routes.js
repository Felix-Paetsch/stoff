const { CONF } = require("../config.js");
const { make_query } = require("../db_connection.js");

module.exports = (app) => {
    app.get("/error", (req, res) => {
        res.status(500).render("./error", {
            CONF,
            "title_msg":  "Something‘s gone wrong, but we are working on it",
            "error_text": "We apologize for the inconvenience, but we‘re currently experiencing some issues.Please check back in a few minutes as we work to resolve the issue. Thank you for your patience."
        })
    });

    app.get("/errors", async (req, res) => {
        try {
            const q = 'SELECT (timestamp, is_frontend, msg) FROM logging WHERE is_error';

            const r = await make_query(q);
            return res.json(r.rows);
        } catch (e) {
            if (!CONF.catch_errors){
                throw e;
            }

            res.json(e);
        }
    });

    app.get("/not_found", (req, res) => {
        res.status(404).render("./error", {
            CONF,
            "title_msg":  "Page Not Found",
            "error_text": "We‘re sorry, but the requested URL is no longer available. It may have been removed or moved to a different location. Please check your URL or try navigating to our homepage to find the information you need. If you believe this is an error, please contact our support team for assistance."
        })
    });

    app.use((req, res, next) => {
        res.status(404).render("./error", {
            CONF,
            "title_msg":  "Page Not Found",
            "error_text": "We‘re sorry, but the requested URL is no longer available. It may have been removed or moved to a different location. Please check your URL or try navigating to our homepage to find the information you need. If you believe this is an error, please contact our support team for assistance."
        })
    });
}