const pointJointActions = require("../data_actions/points_and_joints.js");

module.exports = (app) => {
    app.get("/get_points_for_project", async (req, res) => {
        try {
            const result = await pointJointActions.getPointsForProject(req.body.project_id);
            return res.json({
                error: false,
                points: result
            });
        } catch (err) {
            return res.json({
                error: true,
                message: err.toString(),
                stack: err.stack
            });
        }
    });

    app.get("/get_joints_for_project", async (req, res) => {
        try {
            const result = await pointJointActions.getJointsForProject(req.body.project_id);
            return res.json({
                error: false,
                joints: result
            });
        } catch (err) {
            return res.json({
                error: true,
                message: err.toString(),
                stack: err.stack
            });
        }
    });

    app.post(`/create_point`, async (req, res) => {
        try {
            const result = await pointJointActions.createPoint(req.body.project_id, req.body.name, req.body.color);
            return res.json({
                error: false,
                ...result
            });
        } catch (err) {
            return res.json({
                error: true,
                message: err.message,
                stack: err.stack
            });
        }
    });

    app.post(`/rename_point`, async (req, res) => {
        try {
            const result = await pointJointActions.renamePoint(req.body.point_id, req.body.new_name);
            return res.json({
                error: false,
                ...result
            });
        } catch (err) {
            return res.json({
                error: true,
                message: err.message,
                stack: err.stack
            });
        }
    });

    app.post(`/set_point_position`, async (req, res) => {
        try {
            const result = await pointJointActions.changePointPositon(req.body.point_id, req.body.position);
            return res.json({
                error: false,
                ...result
            });
        } catch (err) {
            return res.json({
                error: true,
                message: err.message,
                stack: err.stack
            });
        }
    });

    app.post(`/delete_point`, async (req, res) => {
        try {
            await pointJointActions.deletePoint(req.body.point_id);
            return res.json({
                error: false,
                message: "Success!"
            });
        } catch (err) {
            return res.json({
                error: true,
                message: err.toString(),
                stack: err.stack
            });
        }
    });

    app.post(`/change_point_color`, async (req, res) => {
        try {
            const result = await pointJointActions.changePointColor(req.body.point_id, req.body.new_color);
            return res.json({
                error: false,
                ...result
            });
        } catch (err) {
            return res.json({
                error: true,
                message: err.toString(),
                stack: err.stack
            });
        }
    });

    app.post(`/create_joint`, async (req, res) => {
        try {
            const result = await pointJointActions.createJoint(req.body.point1_id, req.body.point2_id);
            return res.json({
                error: false,
                joint_id: result
            });
        } catch (err) {
            return res.json({
                error: true,
                message: err.message,
                stack: err.stack
            });
        }
    });

    app.post(`/change_joint`, async (req, res) => {
        try {
            const result = await pointJointActions.changeJoint(req.body.joint_id, req.body.point1_id, req.body.point2_id);
            return res.json({
                error: false,
                ...result
            });
        } catch (err) {
            return res.json({
                error: true,
                message: err.message,
                stack: err.stack
            });
        }
    });

    app.post(`/delete_joint`, async (req, res) => {
        try {
            await pointJointActions.deleteJoint(req.body.joint_id);
            return res.json({
                error: false,
                message: "Success!"
            });
        } catch (err) {
            return res.json({
                error: true,
                message: err.toString(),
                stack: err.stack
            });
        }
    });
}
