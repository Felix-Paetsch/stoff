const { make_query } = require('../../../db_connection.js');
const checkValidName = require("../validate_name.js");
const fs = require("fs");
const batchDataActions = require("./batches.js");
const exampleImageDataActions = require("./ex_img.js");

module.exports = {
    create_project: async (project_name) => {
        if (typeof checkValidName(project_name) == "string"){
            throw new Error(checkValidName(project_name));
        }

        const query = 'INSERT INTO animalproject (name) VALUES ($1) RETURNING *';
        const args = [project_name];
        const res = await make_query(query, args);

        const folderName = `./data/animalProjects/project_${ res.rows[0].id }`;
        fs.mkdirSync(folderName);

        return res.rows[0]
    },
    get_project: async (project_id) => {
        const query = 'SELECT * FROM animalproject WHERE id = $1';
        const args = [project_id];
        const res = await make_query(query, args);
        return {
            ...res.rows[0],
            batches: await batchDataActions.get_batches(project_id),
            example_images: await exampleImageDataActions.getExampleImagesForProject(project_id),
            points: (await make_query("SELECT * FROM point WHERE animal_project_id = $1", [project_id])).rows,
            joints: (await make_query("SELECT * FROM joint WHERE animal_project_id = $1", [project_id])).rows
        };
    },
    get_projects: async () => {
        const query = 'SELECT * FROM animalproject';
        const res = await make_query(query, []);
        for (row of res.rows){
            row.batches = await batchDataActions.get_batches(row.id);
            row.example_images = await exampleImageDataActions.getExampleImagesForProject(row.id);
            row.points = (await make_query("SELECT * FROM point WHERE animal_project_id = $1", [row.id])).rows;
            row.joints = (await make_query("SELECT * FROM joint WHERE animal_project_id = $1", [row.id])).rows;
        }
        return res.rows
    },
    rename_project: async (project_id, new_name) => {
        if (typeof checkValidName(new_name) == "string"){
            throw new Error(checkValidName(new_name));
        }

        const query = 'UPDATE animalproject SET name = $1 WHERE id = $2 RETURNING *';
        const args = [new_name, project_id];
        const res = await make_query(query, args);
        return res.rows[0]
    },
    delete_project: async (project_id) => {
            const query = 'Select * From delete_project($1)';
            const args = [project_id];
            await make_query(query, args);

            const folderPath = `./data/animalProjects/project_${ project_id }`;
            fs.rmSync(folderPath, { recursive: true });
    }
}