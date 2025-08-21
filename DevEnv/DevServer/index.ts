import express from "express";
import path from "path";
import { fileURLToPath } from "url";
import register_routes from "./routes/index.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));

app.use(express.static(path.join(__dirname, "public")));
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

register_routes(app);

app.listen(3008, () => {
    console.log("Server running on http://localhost:3008");
});
