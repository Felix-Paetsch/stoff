
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

import { Config } from "../StoffLib/Config/exports.js";
import create_app from "./app.js";
const app = create_app();

import pattern_data from '../Patterns/export_pattern_web.js';
const { design_config, create_design } = pattern_data;
import debug_create_design from "../Debug/_debug_create_design.js";

import { Sketch } from "../StoffLib/sketch.js";
import register_sketch_mods from "./sketch_mods/register.js";
import register_render_to_url from "./sketch_mods/render_to_url.js";
import clean_rendering_data from "./utils/clean_rendering_data.js";
import exposition from "./exposition.js";

const Sketch_dev = register_sketch_mods(Sketch);
const SketchRouteRenderer = register_render_to_url(Sketch_dev, app);

app.get('/', (req, res) => {
    res.render('index', {
        design_config: new Config(design_config),
        config_components: join(__dirname, "views", "config_components"),
        is_debug: req.query.debug !== undefined
    });
});

app.get("/exposition", (req, res) => {
    res.render("exposition", {
        EX: exposition()
    });
})

let pattern_was_requested = false;
app.post('/pattern', (req, res) => {
    pattern_was_requested = true;
    SketchRouteRenderer.reset();

    const isDebug = req.query.debug !== undefined;

    try {
        const s = !isDebug ? create_design(req.body.config_data) : debug_create_design();
        const svg = s.to_dev_svg(req.body.width, req.body.height);

        res.set('Content-Type', 'image/svg+xml');
        res.json({
            svg,
            rendering_data: clean_rendering_data(s.data),
            error: false
        });

    } catch (error){
        res.status(422).json({
            error: true,
            stack: error.stack
        });
    }
});

app.post('/design_config', (req, res) => {
    res.json((new Config(design_config)).serialize());
});

// create_design((new Config(design_config)).to_obj()).sewing_data();

app.get("/pattern_json", (req, res) => {
    // SketchRouteRenderer.reset();

    const isDebug = req.query.debug !== undefined;

    try {
        const conf_obj = (new Config(design_config)).to_obj();
        const s = !isDebug ? create_design(conf_obj) : debug_create_design();

        res.set('Content-Type', 'image/svg+xml');
        res.json({
            data: s.sewing_data(),
            design_config: design_config,
            error: false
        });
    } catch (error){
        res.status(422).json({
            error: true,
            stack: error.stack
        });
    }
})

app.get('/reset', (req, res) => {
    if (!pattern_was_requested) {
        res.json(true);
    } else {
        res.json(false);
    }
});

const port = 3001;
app.listen(port, () => {
    console.log(`Dev server at http://localhost:${port}`);
});
