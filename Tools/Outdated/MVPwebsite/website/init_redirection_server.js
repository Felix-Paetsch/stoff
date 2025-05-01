import express from 'express';
import { createServer } from 'http';

export default () => {
    const app = express();

    app.all("*", (req, res) => {
        return res.status(301).redirect(`https://${req.headers.host}${req.url}`);
    });

    createServer(app).listen(80, () => {
        console.log(`HTTP redirect listening at PORT :: 80`);
    });
};
