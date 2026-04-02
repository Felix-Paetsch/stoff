const try_respond = require('../try_respond.js');
const get_data_for_annotation_req = require("./data_for_annotation_request.js");
const { CONF } = require('../../config.js');
const { 
    get_current_user_ident_for_batch_id,
    set_current_user_for_batch,
    remove_current_user_for_batch
} = require("./active_batches.js");

module.exports = (app) => {
    app.get(`/a/:project_id/:img_batch_id`, async (req, res) => {
        if ( CONF.enable_edit_guard == true ){
            return try_respond(req, res, async(req, res) => {
                const d = await get_data_for_annotation_req(req); 
                if (d.error){
                    return d.not_found ? res.redirect("/not_found") : res.redirect("/error");
                }

                res.render("h2d2/project_login_page", {
                    ...d,
                    current_active_user_ident: get_current_user_ident_for_batch_id(+req.params.img_batch_id)
                });
            });
        }

        return res.redirect(`/a/${ req.params.project_id }/${ req.params.img_batch_id }/start_editing`);
    });

    app.post("/set_user_ident", async (req, res) => {
        set_current_user_for_batch(req.body.ident, +req.body.batch_id);
        res.sendStatus(200);
    });

    app.get(`/p/:project_id/logout/:img_batch_id`, async (req, res) => {
        remove_current_user_for_batch(req.params.img_batch_id);
        return res.redirect(`/successfully_logged_out?pid=${ req.params.project_id }`);
    });
}