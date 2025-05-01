const { make_query } = require('../../db_connection.js');
const try_respond = require('../try_respond.js');
const { upload_still_justified, renew_activity_timer, remove_current_user_for_batch } = require("./active_batches.js");

module.exports = (app) => {
    app.post(`/requests/upload_all_annotations`, async (req, res) => {
        // Req send from annotation page
        try_respond(req, res, async (req, res) => {
            const { img_data, annotation_start, imgBatchId, project_id } = req.body;

            if (!upload_still_justified(imgBatchId, annotation_start)){
                const redirectUrl = `/a/${project_id}/${ imgBatchId }/edit`;
                res.set('HX-Redirect', redirectUrl);
                return res.sendStatus(200);
            }

            const updateQuery = 'SELECT batch_update_images($1)';
            const updateArgs = [img_data];
            
            const annotated_images_count = img_data.filter(x => x.is_annotated).length;
            const count_query = 'UPDATE image_batch SET labeled_img_count = $1 WHERE id = $2';
            const count_args = [annotated_images_count, imgBatchId];

            await Promise.all([
                make_query(updateQuery, updateArgs), 
                make_query(count_query, count_args)
            ]);

            renew_activity_timer(imgBatchId);
    
            res.status(200).send('Success!');
        });
    });

    app.post(`/requests/upload_all_annotations_force`, async (req, res) => {
        // Req send from python api
        try_respond(req, res, async (req, res) => {
            const { img_data, imgBatchId } = req.body;

            const updateQuery = 'SELECT batch_update_images($1)';
            const updateArgs = [img_data];
            
            const annotated_images_count = img_data.filter(x => x.is_annotated).length;
            const count_query = 'UPDATE image_batch SET labeled_img_count = $1 WHERE id = $2';
            const count_args = [annotated_images_count, imgBatchId];

            await Promise.all([
                make_query(updateQuery, updateArgs), 
                make_query(count_query, count_args)
            ]);

            remove_current_user_for_batch(imgBatchId);
    
            res.status(200).send('Success!');
        });
    });

    app.get("/requests/still_current_user/:project_id/:imgBatchId/:annotation_start", (req, res) => {
        const { imgBatchId, annotation_start, project_id } = req.params;

        if (!upload_still_justified(imgBatchId, annotation_start)){
            const redirectUrl = `/a/${project_id}/${ imgBatchId }/edit`;
            res.set('HX-Redirect', redirectUrl);
        }
        
        return res.sendStatus(200);
    });

    app.get(`/requests/recalculate_annotated_images/:project_id`, async (req, res) => {
        try {
            const { project_id } = req.params;
    
            // Get all images with their points for the specific project
            const query = `
                SELECT i.id AS img_id, i.batch_id, i.is_annotated, i.points
                FROM image i
                JOIN image_batch ib ON i.batch_id = ib.id
                WHERE ib.animal_project_id = $1
            `;
            const result = await make_query(query, [project_id]);
    
            const images = result.rows;
    
            // Loop over images and evaluate the is_annotated value
            for (const image of images) {
                const isAnnotated = evaluate_is_annotated(image.points);
                image.is_annotated = isAnnotated;
            }
    
            // Update the is_annotated value for each image in the database
            /* const updateQuery = 'UPDATE image SET is_annotated = $1 WHERE id = $2';
            for (const image of images) {
                await make_query(updateQuery, [image.is_annotated, image.img_id]);
            } */
            const batchSize = 70;

            for (let i = 0; i < images.length; i += batchSize) {
                const batch = images.slice(i, i + batchSize);
                
                const updateQuery = `
                    UPDATE image AS i
                    SET is_annotated = c.is_annotated
                    FROM (VALUES
                        ${batch.map((image, index) => `($${index * 2 + 1}::bigint, $${index * 2 + 2}::boolean)`).join(',')}
                    ) AS c(id, is_annotated)
                    WHERE i.id = c.id;
                `;
                
                const updateArgs = batch.flatMap(image => [+image.img_id, image.is_annotated ? 1 : 0]);
                await make_query(updateQuery, updateArgs);
            }

            // Update labeled_img_count for each image batch
            const updateBatchQuery = `
                UPDATE image_batch
                SET labeled_img_count = (
                    SELECT COUNT(*)
                    FROM image
                    WHERE batch_id = image_batch.id AND is_annotated = TRUE
                )
                WHERE animal_project_id = $1
            `;
            await make_query(updateBatchQuery, [project_id]);
    
            res.status(200).send("Recalculation completed successfully!");
        } catch (error) {
            console.error(error);
            res.status(500).send("An error occurred during recalculation.");
        }
    });    
}

function evaluate_is_annotated(data){
    try{
        img_points = JSON.parse(data);
        return img_points.filter(p => p.state !== "unannotated").length > 0
    } catch (e) {
        return false;
    }
}