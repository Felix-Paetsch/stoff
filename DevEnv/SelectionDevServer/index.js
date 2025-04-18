import express from "express";
import path from "path";
import { fileURLToPath } from "url";
import register_routes from "./routes/index.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

import Sketch from "../../Core/StoffLib/sketch.js";
import register_dev_serve from "../DevServer/dev_serve.js";
register_dev_serve(Sketch, app);

app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));
app.use(express.static(path.join(__dirname, "public")));
app.use(
    "/DevServer",
    express.static(path.join(__dirname, "../DevServer/public")),
);
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

register_routes(app);

app.listen(3008, () => {
    console.log("Server running on http://localhost:3008");
});
