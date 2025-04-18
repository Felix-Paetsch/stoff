import express from "express";
import { dirname, join } from "path";
import { fileURLToPath } from "url";
import fs from "fs";
import * as sass from "sass";

export default () => {
    const app = express();

    const __filename = fileURLToPath(import.meta.url);
    const __dirname = dirname(__filename);

    app.set("view engine", "ejs");
    app.set("views", join(__dirname, "views"));

    const staticPaths = [join(__dirname, "public"), join(__dirname, "views")];

    // Middleware to check file modification dates and compile Sass/SCSS if needed
    app.get("*.css", async (req, res, next) => {
        for (const staticPath of staticPaths) {
            const cssFilePath = join(staticPath, req.path);
            const scssFilePath = cssFilePath.replace(".css", ".scss");
            const sassFilePath = cssFilePath.replace(".css", ".sass");

            try {
                let sourceFilePath = null;
                if (fs.existsSync(scssFilePath)) {
                    sourceFilePath = scssFilePath;
                } else if (fs.existsSync(sassFilePath)) {
                    sourceFilePath = sassFilePath;
                }

                if (sourceFilePath) {
                    const sourceStats = fs.statSync(sourceFilePath);
                    if (
                        !fs.existsSync(cssFilePath) ||
                        fs.statSync(cssFilePath).mtime < sourceStats.mtime
                    ) {
                        const result = sass.compile(sourceFilePath);
                        res.send(result.css);
                        fs.writeFileSync(cssFilePath, result.css);
                        return;
                    } else {
                        return res.sendFile(cssFilePath);
                    }
                }
            } catch (err) {
                console.error(`Error processing Sass: ${err}`);
                return res.status(500).send("Error compiling Sass/SCSS");
            }
        }

        // If no matching SCSS/Sass file found, move to next middleware
        next();
    });

    staticPaths.forEach((staticPath) => {
        app.use(express.static(staticPath));
    });

    return app;
};
