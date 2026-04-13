const { make_query } = require('../../db_connection.js');
const { CONF } = require('../../config.js');
const fs = require("fs");
const path = require("path");

module.exports = async function get_data_for_annotation_req(req){
    const img_batch_id = req.params.img_batch_id;

    const [img_batch_res, project_res, points_res, joint_res] = await Promise.all([
        make_query('SELECT * FROM image_batch WHERE animal_project_id = $1', [req.params.project_id]), // sort by created_at
        make_query('SELECT * FROM animalproject WHERE id = (SELECT animal_project_id FROM image_batch WHERE id = $1)', [img_batch_id]),
        make_query('SELECT * FROM point WHERE animal_project_id = (SELECT animal_project_id FROM image_batch WHERE id = $1)', [img_batch_id]),
        make_query('SELECT * FROM joint WHERE animal_project_id = (SELECT animal_project_id FROM image_batch WHERE id = $1)', [img_batch_id])
    ]);
    const [img_res, ex_img_res] = await Promise.all([
        make_query('SELECT * FROM image WHERE batch_id = $1 ORDER BY index_in_batch ASC', [img_batch_id]),
        make_query('SELECT * FROM example_img WHERE animal_project_id = $1 ORDER BY id ASC', [req.params.project_id])
    ]);

    if (project_res.rows.length == 0){
        return {
            error: true,
            not_found: true,
            value: "Project doesn't exist"
        }
    }

    if (img_batch_res.rows.length == 0){
        return {
            error: true,
            not_found: true,
            value: "Batch doesn't exist"
        }
    }

    if (img_res.rows.length == 0){
        return {
            error: true,
            not_found: true,
            value: "No images for batch"
        }
    }

    const img_data = img_res.rows.map(row => ({
        id: row.id,
        path: row.path,
        is_annotated: row.is_annotated,
        should_be_used: row.should_be_used,
        points: JSON.parse(row.points), // although this could throw an error in theory
        last_modified: row.last_modified
    }));

    const point_data = points_res.rows.map(row => ({
        id: row.id,
        name: row.name,
        animal_project_point_index: row.animal_project_point_index,
        color: row.color
    }));
    
    const joint_data = joint_res.rows;

    let next_img_batch_id, prev_img_batch_id, current_img_batch_data;
    for (let i = 0; i < img_batch_res.rows.length; i++) {
        if (img_batch_res.rows[i].id == img_batch_id){
            current_img_batch_data = img_batch_res.rows[i];

            const l = img_batch_res.rows.length;
            prev_img_batch_id = img_batch_res.rows[(i - 1 + l) % l].id;
            next_img_batch_id = img_batch_res.rows[(i + 1) % l].id;
        }
    }

    return {
        error: false,
        CONF,
        project_data: project_res.rows[0],
        img_batch_data: current_img_batch_data,
        prev_img_batch_id,
        next_img_batch_id,
        example_images: await Promise.all(ex_img_res.rows.map(async im => {
            return {
                ...im,
                path: await get_ex_img_file_path(im, project_res.rows[0].id)
            }
        })),
        img_data,
        joint_data,
        point_data
    };
}

async function get_ex_img_file_path(img, project_id){
    const dirPath = `./data/animalProjects/project_${project_id}`;
    try {
        const files = fs.readdirSync(dirPath);
        for (const file of files) {
            if (file.startsWith(`ex_img_project_${project_id}__imgID_${img.id}.`)) {
                const filePath = path.join(dirPath, file);
                return path.join("/reroute_files", filePath).replace(/\\/g, "/")
            }
        }
    } catch (error) {
        return ""
    }
}