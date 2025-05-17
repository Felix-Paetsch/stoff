/*
    The exposed function is used to catch all errors that might occur when trying to respond to an incomming request.
    The main purpose for this is to keep thee service running even when some request throws an error.
    Additionally, optionally (See config.json) the error can be logged into the database.
    Use it like so:

    `js
        app.get("/:path/:to/:subir/route", (_req, _res) => {
            try_respond(_req, _res, async (req, res) => {
                // Some function trying to respond. It can by async or not.
                // Avoid using .then without .catch
                // All errors that might occur should be synchronous or in a promise that is awaited ("await").

                res.send("All worked fine!")
            });
        });
    `
*/

const { make_query } = require('../db_connection.js');
const { CONF } = require("../config.js");

module.exports = async function try_respond(req, res, fun) {
    try {
        await fun(req, res);
    } catch (e) {
        if (!CONF.catch_errors){
            throw e;
        }
        
        CONF.send_error_detail ? 
            res.status(500).send(e.toString()) 
            : res.redirect("/error");

        if (!CONF.error_logging){
            return;
        }

        make_query(
            `SELECT log_request_error($1, $2, $3)`, [e.toString(), req.method, req.originalUrl]
        ).catch((e) => {
            console.log(e);
        });
    }
}