import fs from 'fs';
import * as sass from 'sass';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

export default (app) => {
    const __filename = fileURLToPath(import.meta.url);
    const __dirname = dirname(__filename);

    const staticPaths = [
        join(__dirname, "../", 'public'),
        join(__dirname, "../", 'views')
    ];
    
    app.get('*.css', async (req, res, next) => {
        for (const staticPath of staticPaths) {
            const cssFilePath = join(staticPath, req.path);
            const scssFilePath = cssFilePath.replace('.css', '.scss');
            const sassFilePath = cssFilePath.replace('.css', '.sass');

            try {
                let sourceFilePath = null;
                if (fs.existsSync(scssFilePath)) {
                    sourceFilePath = scssFilePath;
                } else if (fs.existsSync(sassFilePath)) {
                    sourceFilePath = sassFilePath;
                }

                if (sourceFilePath) {
                    const sourceStats = fs.statSync(sourceFilePath);
                    if (!fs.existsSync(cssFilePath) || fs.statSync(cssFilePath).mtime < sourceStats.mtime) {
                        const result = sass.compile(sourceFilePath);
                        res.send(result.css);
                        fs.writeFileSync(cssFilePath, result.css);
                        return;
                    } else {
                        return res.sendFile(cssFilePath);
                    }
                }
            } catch (err) {
                next(err);
            }
        }

        // If no matching SCSS/Sass file found, move to next middleware
        next();
    });

    return app;
};
