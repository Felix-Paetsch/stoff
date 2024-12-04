import express from 'express';
import WEBSITE_CONF from "../config.json" assert { type: 'json' };
import compression from 'compression';
import bodyParser from 'body-parser';
import path from 'path';
import rendering_utils from './rendering_utils.js';
import { fileURLToPath } from 'url';
import scss_supprt from "./scss.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export default (app) => {
    if (WEBSITE_CONF.env === 'development') {
        app.set('view cache', false);
    }
    
    scss_supprt(app);
    app.use(express.json({ limit: WEBSITE_CONF.json_limit }));
    app.use(bodyParser.urlencoded({ extended: false }));
    app.use(compression());

    if (WEBSITE_CONF["use_minified"]) {
        app.set('views', path.join(__dirname, "../",'views_tiny'));
        app.use(express.static(path.join(__dirname, "../", 'public_tiny')));
    } else {
        app.set('views', path.join(__dirname, "../", 'views'));
        app.use(express.static(path.join(__dirname, "../", 'public')));
    }

    app.use('/.well-known', express.static(path.join(__dirname, 'public/.well-known'), {
        dotfiles: 'allow'
    }));

    app.set('view engine', 'ejs');

    app.use((req, res, next) => {
        if (!req.headers.host) {
            return res.status(403).send("Bad request: Host header is required\nConsider updating your browser");
        }
        if (req.headers.host.startsWith("www")) {
            return res.status(301).redirect(`https://${req.headers.host.split(".").slice(1).join(".")}${req.url}`);
        }
        return next();
    });

    app.use(rendering_utils);
};