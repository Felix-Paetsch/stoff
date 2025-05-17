const { make_query } = require('../../../db_connection.js');
const checkValidName = require("../validate_name.js");
const path = require('path');
const fs = require('fs');

module.exports = {
    create_batch: async (project_id, batch_name) => {
        const project_data = (await make_query('SELECT * FROM animalproject WHERE id = $1', [project_id])).rows;
        if (project_data.length === 0){
            throw new Error('Project does not exist.');
        }

        const v = checkValidName(batch_name);
        if (typeof v === "string"){
            throw new Error(v);
        }

        const insert_image_batch_query = `
            INSERT INTO image_batch (name, animal_project_id, labeled_img_count, img_count)
            VALUES ($1, $2, 0, 0)
            RETURNING *;
        `;

        const img_batch_info = (await make_query(insert_image_batch_query, [batch_name, project_id])).rows[0];
        const img_batch_folder_name = `img_batch_${img_batch_info.id}`;
        const project_folder_name = `project_${project_id}`;
        const img_batch_path = path.join('data', "animalProjects", project_folder_name, img_batch_folder_name);

        fs.mkdirSync(img_batch_path);
        return {
            batch_id: img_batch_info.id,
            batch_name: img_batch_info.name,
            img_count: 0,
            labled_img_count: 0,
            images: []
        };
    },
    get_batch: async (batch_id) => {
        const query = 'SELECT * FROM image_batch WHERE id = $1';
        const args = [batch_id];
        const img_batch_info = (await make_query(query, args)).rows[0];
        return {
            ...img_batch_info,
            images: (await make_query("SELECT * FROM image WHERE batch_id = $1", [batch_id])).rows
        };
    },
    get_batches: async (project_id) => {
        const query = 'SELECT * FROM image_batch WHERE animal_project_id = $1';
        const args = [project_id];
        const res = (await make_query(query, args)).rows;
        return res;
    },
    rename_batch: async (batch_id, new_name) => {
        if (typeof checkValidName(new_name) == "string"){
            throw new Error(checkValidName(new_name));
        }

        const query = 'UPDATE image_batch SET name = $1 WHERE id = $2 RETURNING *';
        const args = [new_name, batch_id];
        const img_batch_info = (await make_query(query, args)).rows[0];
        return {
            batch_id: img_batch_info.id,
            batch_name: img_batch_info.name,
            img_count: 0,
            labled_img_count: 0,
            images: (await make_query("SELECT * FROM image WHERE batch_id = $1", [batch_id])).rows
        };
    },
    delete_batch: async (project_id, batch_id) => {
        const batchPath = `data/animalProjects/project_${project_id}/img_batch_${batch_id}`;
        fs.rmSync(batchPath, { recursive: true, force: true });
        await make_query("SELECT * FROM delete_img_batch($1)", [batch_id]);
    }
}