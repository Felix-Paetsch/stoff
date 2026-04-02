const require_folder = (folderPath, app) => {
    const fs = require('fs');
    const path = require('path');
  
    fs.readdirSync(path.join("./set_up_routes", folderPath)).forEach((file) => {
      const filePath = path.join(folderPath, file);
      require("./" + filePath)(app);
    });
};

module.exports = (app) => {
    require_folder('h2d2_static', app);
    require_folder('data_routes/backend', app);

    require("./data_routes/reroute_files")(app);

    require("./annotation/login")(app);
    require("./annotation/display_routes")(app);
    require("./annotation/data_routes")(app);
    require("./static/help.js")(app);
    require("./static/instructions.js")(app);
    require("./error_routes.js")(app);
};
  