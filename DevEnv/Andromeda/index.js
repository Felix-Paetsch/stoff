// server.js
const express = require('express');
const app = express();
const port = 3007;

app.set('view engine', 'ejs');

app.get('/', (req, res) => {
    res.render('index');
});

app.listen(port, () => {
    console.log(`Server running on port ${port}`);
});
