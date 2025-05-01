const { make_query } = require('../../db_connection.js');
const try_respond = require('../try_respond.js');
const { CONF } = require('../../config.js');
const { get_current_user_ident_for_batch_id } = require("../annotation/active_batches.js");

module.exports = (app) => {
    app.get(`/p/:project_id`, async (req, res) => {
        try_respond(req, res, async (req, res) => {
            const project_id = req.params.project_id;
            const project_res = (await make_query('SELECT * FROM animalproject WHERE id = $1', [project_id])).rows;

            if (project_res.length == 0){
                return res.redirect("/not_found");
            }

            const project_row = project_res[0];

            const image_batch_res = await make_query('SELECT * FROM image_batch WHERE animal_project_id = $1 ORDER BY name ASC', [project_row.id]);
            const image_batch_rows = image_batch_res.rows;

            res.render("h2d2/single_project.ejs", {
                CONF,
                project_name: project_row.name,
                project_id: project_row.id,
                project_data: project_row,
                annotation_batches: image_batch_rows.map(r => {
                    return {
                        current_user: get_current_user_ident_for_batch_id(r.id),
                        ...r}
                })
            });
        });
    });
}