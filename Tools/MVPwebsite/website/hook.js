import express from 'express';
import { createServer as createHttpsServer } from 'https';
import { createServer as createHttpServer } from 'http';
import fs from 'fs';

import WEBSITE_CONF from "./config.json" assert { type: 'json' };
import register_routes from './routes/index.js';
import register_middleware from "./middleware/main.js";
import add_error_route from "./middleware/errors.js";
import initRedirectionServer from './init_redirection_server.js';

export default (event_manager) => {
    const app = express();
    app.event_manager = event_manager;
    app.use((req, res, next) => {
        req.event_manager = event_manager;
        next();
    });

    let server;
    if (WEBSITE_CONF.is_publish) {
        const options = {
            key: fs.readFileSync(WEBSITE_CONF.private_key_path),
            cert: fs.readFileSync(WEBSITE_CONF.cert_path)
        };
        server = createHttpsServer(options, app);
    } else {
        server = createHttpServer(app);
    }

    register_middleware(app);
    register_routes(app);
    add_error_route(app);

    const port = WEBSITE_CONF.port;
    server.listen(port, "::", () => {
        console.log(`App listening at PORT :: ${port}`);
    });

    if (WEBSITE_CONF.use_https) {
        initRedirectionServer();
    }
}