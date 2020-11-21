const express = require('express')
const app = express()
const mountRoutes = require('./routes')
const port = 3000

app.use(express.json());
app.use(express.urlencoded({extended: true}));


mountRoutes(app)

app.listen(port, () => {
    console.log(`Listening on port ${port}`)
})
