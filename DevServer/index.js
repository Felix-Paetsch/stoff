import express from 'express'; // Use ES6 import for express
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

import pattern_data from '../Patterns/export_pattern_new.js';
const { design_config, create_design } = pattern_data;

// Debug
import { Times, Calls, reset as reset_times } from '../Debug/track_fn.js';

const app = express();
const port = 3001;

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

app.set('views', join(__dirname, 'views'));
app.set('view engine', 'ejs');
app.use(express.json());
app.use(express.static(join(__dirname, 'public')));


app.get('/', (req, res) => {
    res.render('index', { design_config });
});

app.post('/pattern', (req, res) => {
    try {
        reset_times();


        const s = create_design(req.body.config_data);
        /*
            const png_buffer = s.to_png(req.body.width, req.body.height);
            res.set('Content-Type', 'image/png');
            res.send(png_buffer);
        */

        const svg = s.to_svg(req.body.width, req.body.height);
        res.set('Content-Type', 'image/svg+xml');
        res.send(svg);

        /*console.log("============");
        console.log("Calls")
        console.table(Calls);
        console.log("============");
        console.log("Time");
        console.table(Times);*/
    } catch (error){
        res.status(422).send(error.stack);
    }
});

let firstAccess = true;
app.get('/reset', (req, res) => {
    if (firstAccess) {
        firstAccess = false;
        res.json(true);
    } else {
        res.json(false);
    }
});

app.listen(port, () => {
    console.log(`Dev server at http://localhost:${port}`);
});
