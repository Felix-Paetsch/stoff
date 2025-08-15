import { fileURLToPath } from "url";
import fs from "fs";
import path from "path";
import { Express, Request, Response } from "express";
import render_img from "../render.js";
import Sketch from "../../../Core/StoffLib/sketch.js";
import debug_create_design from "../../Debug/debug_create_design.js";
import SewingSketch from "@/Core/PatternLib/sewing_sketch.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const picturePartsPath = path.join(
    __dirname,
    "../../../Data/PreviewPictures/Breit"
);
const pictureParts: { name: string; choices: string[] }[] = [];

fs.readdirSync(picturePartsPath, { withFileTypes: true }).forEach((dirent) => {
    if (dirent.isDirectory()) {
        const folderPath = path.join(picturePartsPath, dirent.name);
        const svgs = fs
            .readdirSync(folderPath)
            .filter((file) => file.endsWith(".svg"));
        pictureParts.push({ name: dirent.name, choices: svgs });
    }
});

export default (app: Express) => {
    let hot_reload_timestamps: number[] = []; // These dont have to be reloaded

    // Start Page
    app.get("/", (req: Request, res: Response) => {
        const state = {
            current_part_selected: 0,
            current_choices: Array(pictureParts.length).fill(0),
            start_ts: null,
        };

        res.render("index", {
            pictureParts,
            state,
        });
    });

    // Send to figure out if we have the current version
    app.post("/hot_reload_req", (req: Request, res: Response) => {
        const state = JSON.parse(req.body.application_state);
        if (hot_reload_timestamps.includes(state.start_ts)) {
            return res.send("");
        }

        hot_reload_timestamps.push(Date.now());
        state.start_ts =
            hot_reload_timestamps[hot_reload_timestamps.length - 1];

        (Sketch as any).dev._reset_routes();
        res.render("htmx/hot_reload_req", {
            pictureParts,
            state,
            render_data: render_img(pictureParts, state),
        });
    });

    // Debug Page for file
    app.get("/debug/:file", (req: Request, res: Response) => {
        const file = req.params.file;
        res.render("debug", {
            file,
        });
    });

    // Check if we have the current version of the file
    app.post("/debug/:file/hot_reload_req", async (req: Request, res: Response) => {
        const state = JSON.parse(req.body.application_state);
        if (hot_reload_timestamps.includes(state.start_ts)) {
            return res.send("");
        }

        hot_reload_timestamps.push(Date.now());
        state.start_ts =
            hot_reload_timestamps[hot_reload_timestamps.length - 1];

        try {
            const s = await debug_create_design(req.params.file);
            res.render("htmx/debug/hot_reload_res", {
                state,
                file: req.params.file,
                to_render: s,
                render_type: s instanceof Sketch ? "sketch" : "sewing" as const,
                error: false
            });
        } catch (error: any) {
            console.log(error);
            res.render("htmx/debug/hot_reload_res", {
                state,
                file: req.params.file,
                error: true,
                msg: error.stack || error.toString()
            });
        }
    });

    // Picture Selection (with composed image preview)
    app.post(`/htmx/pictures`, (req: Request, res: Response) => {
        const state = JSON.parse(req.body.application_state);
        const ret: any = {
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

    // Get the pictures for a specific part, update part selection
    app.post(`/htmx/parts`, (req: Request, res: Response) => {
        const state = JSON.parse(req.body.application_state);
        if (typeof req.body.select_current_part !== "undefined") {
            state.current_part_selected = +req.body.select_current_part;
        }
        res.render("htmx/part_selection", {
            pictureParts,
            state,
        });
    });

    // Get partial pictures
    app.get("/partial_pictures/:folder/:file", (req: Request, res: Response) => {
        const { folder, file } = req.params;
        const width = req.query.width;
        const filePath = path.join(
            __dirname,
            "../../../Data/PreviewPictures/Breit",
            folder,
            file
        );

        fs.readFile(filePath, "utf8", (err, data) => {
            if (err) return res.sendStatus(404);
            if (width) {
                data = data.replace(
                    /stroke-width="[^"]*"/g,
                    `stroke-width="${width}"`
                );
            }
            res.set("Content-Type", "image/svg+xml");
            res.send(data);
        });
    });

    app.get(/.*/, (req: Request, res: Response) => {
        // console.log(req.originalUrl);
        res.sendStatus(404);
    });
};
