import create_design from "../../Patterns/export_pattern_ui_leo.js";

export default function (pictureParts, input_state) {
    try {
        let design_config = {};
        for (let i = 0; i < pictureParts.length; i++) {
            design_config[pictureParts[i].name] =
                pictureParts[i].choices[input_state.current_choices[i]].split(
                    "."
                )[0];
        }

        const s = create_design(design_config);
        const svg = s.to_dev_svg(500, 500);

        return {
            svg: svg,
            message: JSON.stringify(s.data, true, 2),
        };
    } catch (error) {
        console.error(error.stack);

        return {
            message: error.stack,
            svg: null,
        };
    }
}
