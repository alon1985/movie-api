const express = require('express')
const router = express.Router();
const app = express()
const routes = require('./routes.js');
const port = 3000

app.use(express.json());
app.use(express.urlencoded({extended: true}));

app.use('/', routes);

app.listen(port, () => {
    console.log(`Example app listening at http://localhost:${port}`)
})
