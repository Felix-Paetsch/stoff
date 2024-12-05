import redirect_page_not_found from "./utils/redirect_page_not_found.js";
import hot_reload_route from "./utils/hot_reload.js";
import CONF from "../../config.json" assert { type: 'json' };

import register_route from './register_route.js';
import design_routes from './render_choose_design.js';
import submit_measurements_route from './submit_measurements_route.js';

export default function register_routes(app){
    app.get("/", (req, res) => {
        return res.render("main", {
            ...CONF
        });
    });
    
    register_route(app);
    submit_measurements_route(app);
    design_routes(app);
    
    hot_reload_route(app);
    app.use((req, res) => redirect_page_not_found(req, res));
}