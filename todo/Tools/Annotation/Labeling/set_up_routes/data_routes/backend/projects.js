const project_data_actions = require("../data_actions/projects.js");

module.exports = (app) => {
    app.post(`/create_project`, async (req, res) => {
        try {
            const r = await project_data_actions.create_project(req.body.project_name);
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

    app.post(`/rename_project`, async (req, res) => {
        try {
            const r = await project_data_actions.rename_project(req.body.project_id, req.body.project_name);

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

    app.post(`/delete_project`, async (req, res) => {
        try {
            const r = await project_data_actions.delete_project(req.body.project_id);
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

    app.get(`/get_project/:project_id`, async (req, res) => {
        try {
            const r = await project_data_actions.get_project(req.params.project_id);
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

    app.get(`/get_projects`, async (req, res) => {
        try {
            const r = await project_data_actions.get_projects();
            return res.json({
                error: false,
                projects: r
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