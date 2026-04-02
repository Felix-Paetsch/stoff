const { make_query } = require('../../../db_connection.js');
const checkValidName = require("../validate_name.js");

async function validateJointMatch(point1Id, point2Id) {
    const pointQuery = 'SELECT * FROM point WHERE id IN ($1, $2)';
    const pointArgs = [point1Id, point2Id];
    const pointResult = await make_query(pointQuery, pointArgs);

    if (pointResult.rows.length < 2) {
        return 'One point doesn\'t exist.';
    }

    if (point1Id === point2Id) {
        return 'Points must be different.';
    }

    if (pointResult.rows[0].animal_project_id !== pointResult.rows[1].animal_project_id) {
        return "Points must be from the same project";
    }

    const jointQuery = 'SELECT * FROM joint WHERE (point_id = $1 AND connected_point_id = $2) OR (point_id = $2 AND connected_point_id = $1)';
    const jointArgs = [point1Id, point2Id];
    const jointResult = await make_query(jointQuery, jointArgs);

    if (jointResult.rows.length > 0) {
        return 'Joint already exists.';
    }

    return true; // true indicates validation passed
}

module.exports = {
    getPointsForProject: async (project_id) => {
        return (await make_query("SELECT * FROM point WHERE animal_project_id = $1", [project_id])).rows;
    },
    getJointsForProject: async (project_id) => {
        return (await make_query("SELECT * FROM joint WHERE animal_project_id = $1", [project_id])).rows;
    },
    createPoint: async (project_id, name, color) => {
        const check = checkValidName(name);
        if (typeof check == 'string') {
            throw new Error(check);
        }

        const query = 'INSERT INTO point (name, animal_project_id, color) VALUES ($1, $2, $3) RETURNING id AS point_id, name AS point_name, color AS point_color';
        const args = [name, project_id, color];
        return (await make_query(query, args)).rows[0];
    },
    renamePoint: async (point_id, new_name) => {
        const check = checkValidName(new_name);
        if (typeof check == 'string') {
            throw new Error(check);
        }

        const query = 'UPDATE point SET name = $1 WHERE id = $2 RETURNING name, id';
        const args = [new_name, point_id];
        return (await make_query(query, args)).rows[0];
    },
    deletePoint: async (point_id) => {
        const deleteJointsQuery = 'DELETE FROM joint WHERE point_id = $1 OR connected_point_id = $1';
        await make_query(deleteJointsQuery, [point_id]);

        const query = 'DELETE FROM point WHERE id = $1 RETURNING animal_project_id';
        return (await make_query(query, [point_id])).rows[0];
    },
    changePointColor: async (point_id, new_color) => {
        const check = checkValidName(new_color);
        if (typeof check == 'string') {
            throw new Error(check);
        }

        const query = 'UPDATE point SET color = $1 WHERE id = $2 RETURNING color, id';
        return (await make_query(query, [new_color, point_id])).rows[0];
    },
    changePointPositon: async (point_id, new_position) => {
        const query = 'UPDATE point SET animal_project_point_index = $1 WHERE id = $2 RETURNING animal_project_point_index, id';
        return (await make_query(query, [new_position, point_id])).rows[0];
    },
    createJoint: async (point1_id, point2_id) => {
        const validation = await validateJointMatch(point1_id, point2_id);
        if (typeof validation == 'string') {
            throw new Error(validation);
        }

        const animalProjectIdQuery = 'SELECT animal_project_id FROM point WHERE id = $1';
        const animalProjectId = (await make_query(animalProjectIdQuery, [point1_id])).rows[0].animal_project_id;

        const jointQuery = 'INSERT INTO joint (point_id, connected_point_id, animal_project_id) VALUES ($1, $2, $3) RETURNING id';
        const jointResult = (await make_query(jointQuery, [point1_id, point2_id, animalProjectId])).rows[0];

        return jointResult.id; // Returns the new joint's ID
    },
    changeJoint: async (joint_id, point1_id, point2_id) => {
        const validation = await validateJointMatch(point1_id, point2_id);
        if (typeof validation == 'string') {
            throw new Error(validation);
        }

        const query = 'UPDATE joint SET point_id = $1, connected_point_id = $2 WHERE id = $3';
        await make_query(query, [point1_id, point2_id, joint_id]);
        return { joint_id, point1_id, point2_id }; // Returns the updated joint details
    },
    deleteJoint: async (joint_id) => {
        const deleteJointsQuery = 'DELETE FROM joint WHERE id = $1';
        await make_query(deleteJointsQuery, [joint_id]);
        return { status: "Success", message: "Joint deleted successfully." };
        }
    };
