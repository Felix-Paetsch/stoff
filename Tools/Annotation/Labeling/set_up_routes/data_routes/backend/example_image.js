const exampleImageActions = require('../data_actions/ex_img.js');
const fs = require('fs').promises;
const path = require('path');

module.exports = (app) => {
  app.post("/set_example_img_title/:example_img_id/:example_img_title", async (req, res) => {
    try {
      const r = await exampleImageActions.setExampleImageTitle(req.params.example_img_id, req.params.example_img_title);
      res.send({
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

  app.get("/example_images_for_project/:project_id", async (req, res) => {
    try {
      const images = await exampleImageActions.getExampleImagesForProject(req.params.project_id);
      res.json({
          error: false,
          images
      });
    } catch (err){
        return res.json({
            error: true,
            value: err.toString(),
            trace: err.stack
        })
    }
  });

  app.post("/delete_example_image/:project_id/:example_img_id", async (req, res) => {
    try {
      await exampleImageActions.deleteExampleImage(req.params.example_img_id);

      const dirPath = `data/animalProjects/project_${req.params.project_id}`;
      const files = await fs.readdir(dirPath);
      for (const file of files) {
        if (file.startsWith(`ex_img_project_${req.params.project_id}__imgID_${req.params.example_img_id}.`)) {
          const filePath = path.join(dirPath, file);
          await fs.unlink(filePath);
        }
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

  app.post("/set_example_img_points/:example_img_id", async (req, res) => {
    try {
        const r = await exampleImageActions.setExampleImagePoints(req.params.example_img_id, req.body.annotations);
        res.send({
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
}
