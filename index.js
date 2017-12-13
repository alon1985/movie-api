
'use strict';

var express = require('express');
var app = express();
var logger = require('./lib/logger.js');
var compression = require('compression');
var bodyParser = require('body-parser');

app.use(compression());
app.use(bodyParser.urlencoded({extended: true}));
app.use(bodyParser.json());
app.use(require('./routes/routes'));

app.listen(8080, function () {
    logger.info("listening on port 8080");
});
