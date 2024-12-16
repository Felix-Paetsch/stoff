import cConfig from "../../../../StoffLib/Config/config.js";
import Pattern from "../../../../Pictures/entry.js";
import CONF from "../../config.json" assert { type: 'json' };
import { get_user, write_user } from "../db_interaction.js";

export function render_base(res, user){
    const design_config = cConfig.deserialize(user.serialized_config);

    const locals = {
        ...CONF,
        ...user,
        user,
        design_config,
        locals: res.locals,
        svg: Pattern.create_design(design_config.to_obj()).to_svg(300, 400)
    };
    locals.locals = locals;
    res.render("responses/choose_design", locals);
}

export default (app) => {
    app.post("/display_measurements", async (req, res) => {
        const user = await get_user(req.body.ident);
        res.render("responses/measurements", {
            ...CONF,
            ...user,
            measurements: CONF.measurements.map(m => {
                return {
                    key: m.value,
                    display: m.name,
                    value: user.measurements[m.value] ? user.measurements[m.value] : null
                }
            }),
        });
    });

    app.post("/activate_specific_item", async (req, res) => {
        const user = await get_user(req.body.ident);
        const design_config = cConfig.deserialize(user.serialized_config);

        const locals = {
            ...req.body,
            ...CONF,
            ...user,
            user,
            design_config,
            locals: res.locals,
            svg: Pattern.create_design(design_config.to_obj()).to_svg(300, 400),
            make_svg: (dc, w = 300, h = 400) => Pattern.create_design(dc.to_obj()).to_svg(w, h)
        };
        locals.locals = locals;

        res.render("responses/choose_design", locals);
    });

    app.post("/choose_specific_option", async (req, res) => {
        const user = await get_user(req.body.ident);
        const design_config = cConfig.deserialize(user.serialized_config);

        if (req.body.config_type == "option"){
            design_config.get_by_id(req.body.current_selection_option_id).select(+req.body.option);
        } else if (req.body.config_type == "number"){
            design_config.get_by_id(req.body.current_selection_option_id).set(+req.body.value);
        }
        user.serialized_config = design_config.serialize();
        write_user(user);

        const locals = {
            ...req.body,
            ...CONF,
            ...user,
            user,
            design_config,
            locals: res.locals,
            svg: Pattern.create_design(design_config.to_obj()).to_svg(300, 400),
            make_svg: (dc, w = 300, h = 400) => Pattern.create_design(dc.to_obj()).to_svg(w, h)
        };
        locals.locals = locals;

        res.render("responses/choose_design", locals);
    });

    app.post("/preview_number_input", async (req, res) => {
        const user = await get_user(req.body.ident);
        const design_config = cConfig.deserialize(user.serialized_config);
        design_config.get_by_id(req.body.current_selection_option_id).set(+req.body.value);

        res.render("responses/preview_number_input", {
            value: req.body.value,
            svg: Pattern.create_design(design_config.to_obj()).to_svg(400, 500)
        });
    });

    app.post("/thank-you", async (req, res) => {
        res.render("responses/thank_you");
    });
}
