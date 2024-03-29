const express = require('express');
const app = express();
const port = 3001;
const path = require('path');
const { design_config, create_design } = require("../Patterns/export_pattern.js");

// Set EJS as templating engine
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// Define routes
app.get('/', (req, res) => {
    res.render('index', { design_config }); // This will render views/index.ejs
});

app.post('/pattern', (req, res) => {
    try {
        const s = create_design(req.body.config_data);
        /*
            const png_buffer = s.to_png(req.body.width, req.body.height);
            res.set('Content-Type', 'image/png');
            res.send(png_buffer);
        */
        const svg = s.to_svg(req.body.width, req.body.height);
        res.set('Content-Type', 'image/svg+xml');
        res.send(svg);
    } catch (error){
        res.status(422).send(error.stack);
    }
});

let firstAccess = true;
app.get('/reset', (req, res) => {
    if (firstAccess) {
        firstAccess = false; // Update the flag after the first access
        res.json(true);
    } else {
        res.json(false);
    }
});

// Start the server
app.listen(port, () => {
    console.log(`Dev server at http://localhost:${port}`);
});

// Set the directory for EJS templates
app.set('view engine', 'ejs');
