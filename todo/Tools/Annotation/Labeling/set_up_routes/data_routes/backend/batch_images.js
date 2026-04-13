const { make_query } = require('../../../db_connection.js');

const multer = require('multer');
const fs = require('fs');
const path = require('path');

const storage = multer.diskStorage({
  destination: function(req, file, cb) {
    req.file = file;
    cb(null, `data/animalProjects/project_${req.params.project_id}/img_batch_${req.params.img_batch_id}`) // Destination folder
  },
  filename: function(req, file, cb) {
    let pre = "";

    if (!req.query.path){ // req.query non empty => data from upload_img_batch
        pre = String(Date.now()) + "_";
    };

    req.fp = pre + file.originalname;
    cb(null, pre + file.originalname)
  }
});

const upload = multer({ storage: storage });

module.exports = (app) => {
    app.post('/upload_img_to_img_set/project/:project_id/batch/:img_batch_id', upload.single('image'), async (req, res) => {
        try {
            if (!req.file) {
                // If no file was uploaded, send an error response
                return res.status(400).json({
                    error: true,
                    value: "No file was uploaded."
                });
            }

            // Full path where the file is supposed to be
            const destPath = path.join(`data/animalProjects/project_${req.params.project_id}/img_batch_${req.params.img_batch_id}`, req.fp);

            // Check if the file actually exists
            if (!fs.existsSync(destPath)) {
                return res.status(404).json({
                    error: true,
                    value: "Uploaded file is missing on the server."
                });
            }
            
            const query_res = req.query.path ? await create_backup_img_db_entry(destPath, req.query) : await create_img_db_entry(destPath, req.params.img_batch_id);
            res.send({
                error: false,
                ...query_res.rows[0]
            });
        } catch (err){
            return res.json({
                error: true,
                value: err.toString(),
                trace: err.stack
            })
        }
    });

    app.post('/delete_img/:img_id', async (req, res) => {
        try {
            const img_res = await make_query("SELECT * FROM image WHERE id = $1", [req.params.img_id])

            if (img_res.rows.length == 0){
              return res.send({
                error: false
              });
            }
            let newPathComponents = img_res.rows[0].path.split('/').slice(2); // remove /reroute
    	      let modifiedFilePath = newPathComponents.join('/');

            fs.unlinkSync(modifiedFilePath);
            await make_query("DELETE FROM image WHERE id = $1", [req.params.img_id]);

            const update_img_batch_query = `
              UPDATE image_batch
              SET img_count = img_count - 1
              WHERE id = $1;
            `;
            await make_query(update_img_batch_query, [img_res.rows[0].batch_id]);

            if (img_res.rows[0].is_annotated){
              const update_img_batch_query = `
                UPDATE image_batch
                SET labeled_img_count = labeled_img_count - 1
                WHERE id = $1;
              `;
              await make_query(update_img_batch_query, [img_res.rows[0].batch_id]);
            }

            res.send({
                error: false
            });
        } catch (err){
            return res.json({
                error: true,
                value: err.toString(),
                trace: err.stack
            })
        }
    });
}

async function create_backup_img_db_entry(image_path, img_data) {
  // Read images from the folder containing the uploaded image
  const images = await read_images_from_img_folder(path.dirname(image_path));
  const img_count = images.length; // Number of images in the folder

  // Update image batch with the new count
  const update_img_batch_query = `
    UPDATE image_batch
    SET img_count = $1
    WHERE id = $2;
  `;
  await make_query(update_img_batch_query, [img_count, img_data.new_batch_id]);

  // Insert the single new image into the database
  const insert_image_query = `
      INSERT INTO image (batch_id, path, index_in_batch, is_annotated, points)
      VALUES ($1, $2, $3, $4, $5) RETURNING *;
  `;
  
  return await make_query(insert_image_query, [img_data.new_batch_id, "/reroute_files/" + image_path.replace(/\\/g, "/"), img_data.index_in_batch, img_data.is_annotated, img_data.points]);
}

async function create_img_db_entry(image_path, img_batch_id) {
  // Read images from the folder containing the uploaded image
  const images = await read_images_from_img_folder(path.dirname(image_path));
  const img_count = images.length; // Number of images in the folder

  // Update image batch with the new count
  const update_img_batch_query = `
    UPDATE image_batch
    SET img_count = $1
    WHERE id = $2;
  `;
  await make_query(update_img_batch_query, [img_count, img_batch_id]);

  // Insert the single new image into the database
  const insert_image_query = `
      INSERT INTO image (batch_id, path, index_in_batch, is_annotated, points)
      VALUES ($1, $2, $3, $4, '[]') RETURNING *;
  `;
  
  return await make_query(insert_image_query, [img_batch_id, "/reroute_files/" + image_path.replace(/\\/g, "/"), img_count, false]);
}


function read_images_from_img_folder(folder_path) {
  const extensions = ['.jpg', '.jpeg', '.png'];
  const images = [];
  const folder_files = fs.readdirSync(folder_path);
  
  folder_files.forEach(file => {
    const file_extension = path.extname(file).toLowerCase();
    if (extensions.includes(file_extension)) {
      const file_path = path.join(folder_path, file);
      images.push(file_path);
    }
  });
  return images;
}