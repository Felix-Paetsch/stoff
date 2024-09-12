import express from 'express'; // Use ES6 import for express
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';
import sass from 'sass';

export default () => {
    const app = express();

    const __filename = fileURLToPath(import.meta.url);
    const __dirname = dirname(__filename);

    
    app.set('view engine', 'ejs');
    app.set('views', join(__dirname, 'views'));

    // Array of static paths
    const staticPaths = [
        join(__dirname, 'public'),
        join(__dirname, 'views')
    ];

    // Use express.static for each path in the staticPaths array
    staticPaths.forEach((staticPath) => {
        app.use(express.static(staticPath));
    });

    // Middleware to compile .sass / .scss to .css
    app.get('*.css', async (req, res, next) => {
        // Iterate over static paths to find SCSS/SASS files
        for (const staticPath of staticPaths) {
            const cssFilePath = join(staticPath, req.path);
            const scssFilePath = cssFilePath.replace('.css', '.scss');
            const sassFilePath = cssFilePath.replace('.css', '.sass');

            try {
                // Check if SCSS or Sass file exists
                if (fs.existsSync(scssFilePath)) {
                    const result = sass.compile(scssFilePath);
                    res.set('Content-Type', 'text/css');
                    return res.send(result.css);
                } else if (fs.existsSync(sassFilePath)) {
                    const result = sass.compile(sassFilePath);
                    res.set('Content-Type', 'text/css');
                    return res.send(result.css);
                }
            } catch (err) {
                // Handle any errors during compilation
                console.error(`Error compiling Sass: ${err}`);
                return res.status(500).send('Error compiling Sass/SCSS');
            }
        }

        // If no matching SCSS or Sass file is found, continue to next middleware
        next();
    });

    return app;
}