import create_app from "./app.js";
const app = create_app();

app.get('/', (req, res) => {
    res.render('index');
});

const port = 3002;
app.listen(port, () => {
    console.log(`Dev server at http://localhost:${port}`);
});