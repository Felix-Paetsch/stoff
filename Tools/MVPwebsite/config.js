const fs = require('fs');

const CONF = JSON.parse(
    fs.readFileSync("data/config.json")
)

module.exports = {
    CONF
}