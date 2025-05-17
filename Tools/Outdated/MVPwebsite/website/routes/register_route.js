import CONF from "../../config.json" with {type: "json"};
import bcrypt from 'bcrypt';
import Pattern from "../../../../Pictures/entry.js";
import { write_user } from "../db_interaction.js";

export default (app) => {
    app.post("/register", (req, res) => {
        const { name, password } = req.body;
        app.event_manager.emit("jdb_read_global", async (data) => {
            let user = null;

            for (let i = 0; i < data.length; i++){
                if (data[i].name == name && await verifyPassword(password, data[i].password)){
                    user = data[i];
                    break;
                } else if (data[i].name == name){
                    return res.render("responses/register_wrong_pw", {
                        ...CONF
                    });
                }
            }

            if (user == null){
                user = {
                    name,
                    password: await hashPassword(password),
                    ident: generateIdent(),
                    timestamp: Date.now(),
                    measurements: {},
                    serialized_config: Pattern.design_config.serialize()
                }

                write_user(user);
            }

            res.render("responses/measurements", {
                ...CONF,
                measurements: CONF.measurements.map(m => {
                    return {
                        ...m,
                        key: m.value,
                        display: m.name,
                        value: user.measurements[m.value] ? user.measurements[m.value] : null
                    }
                }),
                name: user.name,
                ident: user.ident
            });
        });
    });
}

async function verifyPassword(plainTextPassword, hashedPassword){
    const isMatch = await bcrypt.compare(plainTextPassword, hashedPassword);
    return isMatch;
};

async function hashPassword(plainTextPassword){
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(plainTextPassword, saltRounds);
    return hashedPassword;
};

function generateIdent() {
    const now = Date.now(); // Current timestamp in milliseconds
    const random = Math.random().toString(36).substring(2, 8); // Random 6 characters
    const timePart = now.toString(36).slice(-4); // Last 4 characters of timestamp in base-36
    return timePart + random; // Combine for 10 characters
}
