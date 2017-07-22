
'use strict';

var express = require('express');
var app = express();
var logger = require('./lib/logger.js');
var compression = require('compression');

app.use(compression());
app.use(require('./routes/routes'));

app.listen(3000, function () {
    logger.info("listening on port 3000");
});
