// exampleImageActions.js
const fs = require("fs");
const path = require("path");
const { make_query } = require('../../../db_connection.js');

module.exports = {
  setExampleImageTitle: async (example_img_id, example_img_title) => {
    const set_query = 'UPDATE example_img SET title = $1 WHERE id = $2 RETURNING *;';
    const r = await make_query(set_query, [example_img_title, example_img_id]);
    return r.rows[0];
  },

  getExampleImagesForProject: async (project_id) => {
    const res = (await make_query("SELECT * FROM example_img WHERE animal_project_id = $1", [project_id])).rows;
    
    res.forEach(r => {
      const dirPath = `./data/animalProjects/project_${project_id}`;
      const files = fs.readdirSync(dirPath);
      for (const file of files) {
          if (file.startsWith(`ex_img_project_${project_id}__imgID_${r.id}.`)) {
              const filePath = path.join(dirPath, file);
              r.path = path.join("/reroute_files", filePath).replace(/\\/g, "/");
              return;
          }
      }
      
      throw new Error("Couldn't find image file path");
    });
    return res;
  },

  deleteExampleImage: async (example_img_id) => {
    await make_query("DELETE FROM example_img WHERE id = $1", [example_img_id]);
  },

  setExampleImagePoints: async (example_img_id, annotations) => {
    const set_query = 'UPDATE example_img SET points = $1 WHERE id = $2 RETURNING *;';
    const r = await make_query(set_query, [JSON.stringify(annotations), example_img_id]);
    return r.rows[0];
  }
};
