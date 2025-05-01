const fs = require('fs');

const CONF = JSON.parse(
    fs.readFileSync("data/config.json")
);

CONF.abs_path = (str = "") => {
    return CONF.website_path + "/" + str;
}

const DB_CONF = JSON.parse(
    fs.readFileSync("database_handling/db_config.json")
);

module.exports = {
    CONF,
    DB_CONF
};