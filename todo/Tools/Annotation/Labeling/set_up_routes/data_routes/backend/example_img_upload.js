const multer = require('multer');
const fs = require('fs').promises;
const path = require('path');
const { make_query } = require('../../../db_connection.js');

module.exports = (app) => {
    const storage = multer.diskStorage({
    destination: (req, file, cb) => {
      const project_id = req.params.project_id;
      // Temporary directory, you might want to clean this up after moving the file
      cb(null, `data/temp`);
    },
    filename: (req, file, cb) => {
      const project_id = req.params.project_id;
      const file_extension = path.extname(file.originalname);
      // Use a temporary filename; you will rename this later
      cb(null, `temp_ex_img_project_${project_id}${file_extension}`);
    }
    });

    // Define the file filter to only allow png and jpg files
    const fileFilter = (req, file, cb) => {
      const filetypes = /png|jpg|jpeg/;
      const mimetype = filetypes.test(file.mimetype.toLowerCase());
      const extname = filetypes.test(path.extname(file.originalname).toLowerCase());
    
      if (mimetype && extname) {
        return cb(null, true);
      } else {
        cb('Error: Only .png and .jpg files are allowed!');
      }
    };
    
    // Define the multer middleware
    const upload = multer({ storage, fileFilter });

    app.post("/upload_example_image/:project_id/:title", upload.single('image'), async (req, res) => {
      if (!req.file) {
        return res.json({
            error: true,
            value: "No image uploaded!"
        });
      }
    
      try {
        const project_id = req.params.project_id;
        
        // Insert into database
        const imgQuery = 'INSERT INTO example_img (animal_project_id, points, title) VALUES ($1, $2, $3) RETURNING *';
        const imgArgs = [project_id, "[]", req.params.title];
        const imgResult = await make_query(imgQuery, imgArgs);
        const img_id = imgResult.rows[0].id;
    
        // Calculate new filepath
        const file_extension = path.extname(req.file.originalname);
        const newFilePath = `data/animalProjects/project_${project_id}/ex_img_project_${project_id}__imgID_${img_id}${file_extension}`;
        await fs.rename(req.file.path, newFilePath);
    
        // Send response
        res.json({
            error: false,
            ...imgResult.rows[0]
        });
      } catch (error) {
        // Attempt to clean up the temporary file in case of failure
        try {
             await fs.unlink(req.file.path);
        } catch (cleanupError) {
            console.error(`Failed to clean up temporary file: ${cleanupError}`);
        }
        
        return res.json({
            error: true,
            value: error.toString(),
            trace: error.stack
        });
    }
    });
}