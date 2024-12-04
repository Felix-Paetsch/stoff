
import redirect_page_not_found from "./utils/redirect_page_not_found.js";
import hot_reload_route from "./utils/hot_reload.js";
import Pattern from "../../../../Pictures/entry.js";

export default function register_routes(app){
    app.get("/", (req, res) => {
        return res.render("main", {
            design_config: Pattern.design_config,
            svg: Pattern.create_design(Pattern.design_config.to_obj()).to_dev_svg(300,400)
        });
    })

    hot_reload_route(app);
    app.use((req, res) => redirect_page_not_found(req, res));
}