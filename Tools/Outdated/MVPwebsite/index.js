const dotenvPath = path.resolve('../../node_modules/dotenv');
await import(`file://${dotenvPath}/config.js`);

import fs from 'fs/promises';
import path from 'path';
import CONF from "./config.json" with {type: "json"};
import EventManager from "./event_manager.js";


const event_manager = new EventManager();

const executeHooks = async () => {
    const currentDir = process.cwd();
    const folders = await fs.readdir(currentDir, { withFileTypes: true });

    // Prepare the list of allowed modules from config
    const allowedModules = Array.isArray(CONF.use_modules) && CONF.use_modules.length > 0
        ? CONF.use_modules.map(module => module.toLowerCase())
        : null;

    for (const folder of folders) {
        if (folder.isDirectory()) {
            const folderName = folder.name.toLowerCase();

            // Skip folders not in the allowedModules list, if the list is provided
            if (allowedModules && !allowedModules.includes(folderName)) continue;

            const hookPath = path.join(currentDir, folder.name, 'hook.js');

            // Check if hook.js exists
            const fileExists = await fs
                .access(hookPath)
                .then(() => true)
                .catch(() => false);

            if (!fileExists) continue;

            try {
                const hook = await import(`file://${hookPath}`);
                if (typeof hook.default === 'function') {
                    hook.default(event_manager);
                }
            } catch (error) {
                if (CONF.catch_module_error) {
                    console.error(`Error loading or executing ${hookPath}:`, error.message);
                } else {
                    throw error;
                }
            }
        }
    }
};

executeHooks();
