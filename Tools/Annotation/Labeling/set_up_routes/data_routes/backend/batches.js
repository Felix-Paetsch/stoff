const batch_data_actions = require("../data_actions/batches.js");

module.exports = (app) => {
    app.post(`/create_batch`, async (req, res) => {
        try {
            const r = await batch_data_actions.create_batch(req.body.project_id, req.body.batch_name);
            return res.json({
                error: false,
                ...r
            });
        } catch (err){
            return res.json({
                error: true,
                value: err.toString(),
                trace: err.stack
            })
        }
    });

    app.post(`/rename_batch`, async (req, res) => {
        try {
            const r = await batch_data_actions.rename_batch(req.body.batch_id, req.body.name);
            return res.json({
                error: false,
                ...r
            });
        } catch (err){
            return res.json({
                error: true,
                value: err.toString(),
                trace: err.stack
            })
        }
    });

    app.post(`/delete_batch`, async (req, res) => {
        try {
            const r = await batch_data_actions.delete_batch(req.body.project_id, req.body.batch_id);
            return res.json({
                error: false
            });
        } catch (err){
            return res.json({
                error: true,
                value: err.toString(),
                trace: err.stack
            });
        }
    });

    app.get(`/get_batch/:batch_id`, async (req, res) => {
        try {
            const r = await batch_data_actions.get_batch(req.params.batch_id);
            return res.json({
                error: false,
                ...r
            });
        } catch (err){
            return res.json({
                error: true,
                value: err.toString(),
                trace: err.stack
            });
        }
    });

    app.get(`/get_batches/:project_id`, async (req, res) => {
        try {
            const r = await batch_data_actions.get_batches(req.params.project_id);
            return res.json({
                error: false,
                batches: r
            });
        } catch (err){
            return res.json({
                error: true,
                value: err.toString(),
                trace: err.stack
            });
        }
    });
}