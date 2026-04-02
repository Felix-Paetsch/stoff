const { make_query } = require('../../db_connection.js');
const try_respond = require('../try_respond.js');
const { CONF } = require('../../config.js');

module.exports = (app) => {
    app.get(`/`, (req, res) => {
        try_respond(req, res, async(req, res) => {
            const result = await make_query(`SELECT * FROM get_all_animal_projects() ORDER BY name ASC`);

            res.render("h2d2/projects.ejs", {
                CONF,
                projects: result.rows
            });
        });
    });
}