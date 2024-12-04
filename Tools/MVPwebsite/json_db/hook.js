import fs from 'fs/promises';
import path from 'path';

let current_data = null;

const dataFilePath = path.join(process.cwd(), './data/global_storage.json');

const loadInitialData = async () => {
    try {
        const fileContent = await fs.readFile(dataFilePath, 'utf8');
        current_data = JSON.parse(fileContent);
        console.log("Global JSON storage loaded.");
    } catch (error) {
        console.log(`Global JSON storage reset.`);
        current_data = null;
    }
};

const saveDataToFile = async (data) => {
    try {
        await fs.writeFile(dataFilePath, JSON.stringify(data, null, 2), 'utf8');
    } catch (error) {
        console.error(`Failed to save global storage: ${error.message}`);
    }
};

export default async (event_manager) => {
    // Load the initial data from the JSON file
    await loadInitialData();

    // Handle writing global data
    event_manager.on("jdb_write_global", async (data) => {
        current_data = data;
        await saveDataToFile(data); // Save data to file whenever written
    });

    // Handle reading global data
    event_manager.on("jdb_read_global", (callback) => {
        return callback(current_data);
    });
};
