const { make_query } = require('../../db_connection.js');
const try_respond = require('../try_respond.js');
const get_data_for_annotation_req = require("./data_for_annotation_request.js");
const { CONF } = require('../../config.js');
const { 
    get_current_user_ident_for_batch_id, 
    user_ident_is_valid, 
    set_current_user_for_batch,
    get_annotation_start 
} = require("./active_batches.js");

module.exports = (app) => {
    app.get(`/a/:project_id/:img_batch_id/edit`, (req, res) => {
        if ( CONF.enable_edit_guard === false ){
            return res.redirect(`/a/${ req.params.project_id }/${ req.params.img_batch_id }/start_editing`);
        }

        res.redirect(`/a/${ req.params.project_id }/${ req.params.img_batch_id }`);
    });

    app.post(`/a/:img_batch_id`, (req, res) => {
        try_respond(req, res, async (req, res) => {
            const imgBatchId = req.params.img_batch_id;

            if (req.body.send_from_no_user === "true" && get_current_user_ident_for_batch_id(req.params.img_batch_id) != null){
                res.set('HX-Redirect', `/a/${imgBatchId}/`);
                return res.sendStatus(200);
            }

            const ident_is_valid = user_ident_is_valid(req.body.user_ident); // true || error_msg
            if (!(ident_is_valid === true)){
                return res.send(ident_is_valid); // The error msg
            }

            set_current_user_for_batch(req.body.user_ident, req.params.img_batch_id);
            
            const redirectUrl = `/a/${imgBatchId}/edit_temp`;
            res.set('HX-Redirect', redirectUrl);
            res.sendStatus(200);
        });
    });

    app.get(`/a/:project_id/:img_batch_id/start_editing`, (req, res) => {
        try_respond(req, res, async(req, res) => {
            const res_data = await get_data_for_annotation_req(req);
            if (res_data.error){
                if (res_data.not_found){
                    return res.redirect("/not_found");
                }

                res.redirect("/error");
            }
            
            res.render("user_annotation/edit_enabled/main", {
                ...res_data,
                edit_enabled: true,
                annotation_start: get_annotation_start(res_data.img_batch_data.id)
            });
        });
    });

    app.get(`/a/:project_id/:img_batch_id/read_only`, (req, res) => {
        try_respond(req, res, async(req, res) => {
            const res_data = await get_data_for_annotation_req(req);
            
            res.render("user_annotation/edit_disabled/main", {
                ...res_data,
                edit_enabled: false,
                annotation_start: get_annotation_start(res_data.img_batch_data.id)
            });
        });
    });
}

