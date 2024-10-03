const express = require('express');
const fs = require('fs');
const path = require('path');

const app = express();
const port = 3010;

app.set('view engine', 'ejs');
app.use(express.static('public'));
app.use(express.json());

/* 
    data/to_measure.json
    contains and array of strings - things to measure
*/

app.get('/', (req, res) => {
    fs.readFile(path.join(__dirname, './data/to_measure.json'), 'utf8', (err, data) => {
        if (err) {
            console.error('Error reading file', err);
            res.status(500).send('Internal Server Error');
        } else {
            const measurements = JSON.parse(data);
            measurements.unshift("Name");
            res.render('index', { measurements });
        }
    });
});

app.post('/submit', (req, res) => {
    const data = req.body;
    const timestamp = Date.now();
    data._timestamp = new Date(timestamp).toISOString(); // Rename timestamp to _timestamp

    // Get the number of JSON files in the "./data" directory
    fs.readdir(path.join(__dirname, './data'), (err, files) => {
        if (err) {
            console.error('Error reading directory', err);
            res.status(500).send('Internal Server Error');
            return;
        }

        const jsonFiles = files.filter(file => file.endsWith('.json'));
        data._measurement_num = jsonFiles.length; // Add _measurement_num as the number of JSON files

        const filePath = path.join(__dirname, `./data/measurements_${timestamp}.json`);

        fs.writeFile(filePath, JSON.stringify(data, null, 2), (err) => {
            if (err) {
                console.error('Error writing file', err);
                res.status(500).send('Internal Server Error');
            } else {
                console.log(`Data saved to ${filePath}`);
                res.status(200).send('Data received and stored successfully');
            }
        });
    });
});

app.listen(port, () => {
    console.log(`Server is running on http://localhost:${port}`);
});
