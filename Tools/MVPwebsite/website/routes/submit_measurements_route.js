import CONF from "../../config.json" assert { type: 'json' };
import { get_user, write_user } from "../db_interaction.js";
import { render_base } from "./render_choose_design.js";

export default (app) => {
    app.post("/submit-measurements", async (req, res) => {
        const user = await get_user(req.body.user_ident);
        const measurements = Object.keys(req.body)
            .filter(key => key.startsWith('measurement]'))
            .map(key => {
                const measurementName = key.replace('measurement][', '');
                const rawValue = req.body[key];
                let parsedValue = null;
                let error = false;
        
                try {
                    const normalizedValue = rawValue.replace(',', '.');
                    
                    if (/^[0-9]+(\.[0-9]+)?$/.test(normalizedValue)) {
                        const floatValue = parseFloat(normalizedValue);
                        if (floatValue > 0) {
                            parsedValue = floatValue;
                        } else {
                            error = true;
                        }
                    } else {
                        error = true;
                    }
                } catch (e) {
                    error = true;
                }
        
                return {
                    key: measurementName,
                    value: rawValue,
                    error,
                    parsed_value: parsedValue
                };
            });

        // Wrong Measurements
        if (measurements.some(m => m.error)){
            res.render("responses/measurements", {
                ...CONF,
                ...user,
                measurements: measurements.map(mea => {
                    const confItem = CONF.measurements.find(m => m.value === mea.key) || {};
                    return {
                        ...confItem,
                        ...mea,
                        display: confItem.name
                    };
                }),
                user
            });
            return;
        }

        user.measurements = {};
        measurements.forEach(m => {
            user.measurements[m.key] = m.parsed_value;
        });

        await write_user(user);

        render_base(res, user);
    });
}