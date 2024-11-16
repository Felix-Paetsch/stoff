const { make_query } = require('../db_connection.js');
const { CONF } = require("../config.js");

module.exports = async function try_respond(req, res, DATA, fun, send_error_detail = false) {
    // return await fun(req, res);
    try {
        await fun(req, res);
    } catch (e) {
        if (!CONF.catch_errors){
            throw e;
        }
        
        if (send_error_detail){
            make_query(
                `INSERT INTO ErrorLog (error_msg, is_admin_error, is_page_not_found_error, page, lan)
                VALUES (
                    $1, $2, $3, $4, $5
                );`, [e.toString(), true, false, req.originalUrl, req.language_short]
            ).catch((e) => {
                // console.log(e);
            });
            return res.status(500).send(e.toString());
        }

        const lan_data = DATA[req.language_short];

        try {
            await make_query(
                `INSERT INTO ErrorLog (error_msg, is_admin_error, is_page_not_found_error, page, lan)
                VALUES (
                    $1, $2, $3, $4, $5
                );`, [e.toString(), false, false, req.originalUrl, req.language_short]
            )
        } catch (e) {
            // bcs database mose likely doesnt work -> show unavailable
            // console.log(e)

            res.set('Content-Type', 'text/html');
            return res.status(503).render("error_page", {
                ...lan_data,
                title: lan_data.texts.unavailable_title,
                descr: lan_data.texts.unavailable_descr,
                texts: lan_data.texts,
                error_code: 503,
                error_name: lan_data.texts.unavailable_error_error_name,
                suggestion_list: {
                    "path": "random",
                    "text": lan_data.texts.random_suggestions_text
                },
                CONF
            });
        }

        res.set('Content-Type', 'text/html');
        return res.status(500).render("error_page", {
                ...lan_data,
                title: lan_data.texts.server_error_title,
                descr: lan_data.texts.server_error_descr,
                texts: lan_data.texts,
                error_code: 500,
                error_name: lan_data.texts.server_error_error_name,
                suggestion_list: {
                    "path": "random",
                    "text": lan_data.texts.random_suggestions_text
                },
                CONF
        });
    }
}