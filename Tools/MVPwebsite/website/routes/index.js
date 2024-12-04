import bcrypt from 'bcrypt';
import redirect_page_not_found from "./utils/redirect_page_not_found.js";
import hot_reload_route from "./utils/hot_reload.js";
import Pattern from "../../../../Pictures/entry.js";
import CONF from "../../config.json" assert { type: 'json' };

export default function register_routes(app){
    app.get("/", (req, res) => {
        return res.render("main", {
            ...CONF
        });
    });
    
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
                    timestamp: Date.now()
                }

                data.push(user);
                app.event_manager.emit("jdb_write_global", data)
            }

            res.render("responses/register", {
                ...CONF,
                name: user.name,
                ident: user.ident
            });
        });
    });

    hot_reload_route(app);
    app.use((req, res) => redirect_page_not_found(req, res));
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