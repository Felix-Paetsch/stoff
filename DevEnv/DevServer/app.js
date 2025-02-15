import express from 'express'; // Use ES6 import for express
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

export default () => {
    const app = express();

    const __filename = fileURLToPath(import.meta.url);
    const __dirname = dirname(__filename);

    app.set('views', join(__dirname, 'views'));
    app.set('view engine', 'ejs');
    app.use(express.json());
    app.use(express.static(join(__dirname, 'public')));
    app.use("/conf", express.static(join(__dirname, '../../StoffLib/Config')));
    app.use("/Debug", express.static(join(__dirname, '../Debug')));
    app.use("/DevEnv/Debug", express.static(join(__dirname, '../Debug')));

    return app;
}