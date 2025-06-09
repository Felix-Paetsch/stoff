import { fileURLToPath } from "url";
import fs from "fs";
import path from "path";
import render_img from "../render.js";
import Sketch from "../../../Core/StoffLib/sketch.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const picturePartsPath = path.join(
    __dirname,
    "../../../Data/PreviewPictures/Breit",
);
const pictureParts = [];

fs.readdirSync(picturePartsPath, { withFileTypes: true }).forEach((dirent) => {
    if (dirent.isDirectory()) {
        const folderPath = path.join(picturePartsPath, dirent.name);
        const svgs = fs
            .readdirSync(folderPath)
            .filter((file) => file.endsWith(".svg"));
        pictureParts.push({ name: dirent.name, choices: svgs });
    }
});

export default (app) => {
    let hot_reload_timestamps = []; // These dont have to be reloaded

    app.get("/", (req, res) => {
        const state = {
            current_part_selected: 0,
            current_choices: Array(Object.keys(pictureParts).length).fill(0),
            start_ts: null,
        };

        res.render("index", {
            pictureParts,
            state,
        });
    });

    app.post("/hot_relaod_req", (req, res) => {
        const state = JSON.parse(req.body.application_state);
        if (hot_reload_timestamps.includes(state.start_ts)) {
            return res.send("");
        }

        hot_reload_timestamps.push(Date.now());
        state.start_ts =
            hot_reload_timestamps[hot_reload_timestamps.length - 1];

        res.render("htmx/hot_reload_res", {
            state
        });
    });

    app.post("/hot_relaod_req_res", (req, res) => {
        const state = JSON.parse(req.body.application_state);
        Sketch.dev._reset_routes();
        res.render("htmx/hot_reload_req_res", {
            pictureParts,
            state,
            render_data: render_img(pictureParts, state),
        });
    })

    app.post(`/htmx/pictures`, (req, res) => {
        const state = JSON.parse(req.body.application_state);
        const ret = {
            pictureParts,
            state,
        };
        if (typeof req.body.choice_at_current_part !== "undefined") {
            state.current_choices[state.current_part_selected] =
                +req.body.choice_at_current_part;

            ret.render_data = render_img(pictureParts, state);
        }
        res.render("htmx/picture_selection", ret);
    });

    app.post(`/htmx/parts`, (req, res) => {
        const state = JSON.parse(req.body.application_state);
        if (typeof req.body.select_current_part !== "undefined") {
            state.current_part_selected = +req.body.select_current_part;
        }
        res.render("htmx/part_selection", {
            pictureParts,
            state,
        });
    });

    app.get("/partial_pictures/:folder/:file", (req, res) => {
        const { folder, file } = req.params;
        const width = req.query.width;
        const filePath = path.join(
            __dirname,
            "../../../Data/PreviewPictures/Breit",
            folder,
            file,
        );

        fs.readFile(filePath, "utf8", (err, data) => {
            if (err) return res.sendStatus(404);
            if (width) {
                data = data.replace(
                    /stroke-width="[^"]*"/g,
                    `stroke-width="${width}"`,
                );
            }
            res.set("Content-Type", "image/svg+xml");
            res.send(data);
        });
    });

    app.get("*", (req, res) => {
        // console.log(req.originalUrl);
        res.sendStatus(404);
    });
};
