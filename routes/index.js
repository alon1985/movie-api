'use strict';

const movies = require('./movies.js');
const stats = require('./stats.js');
const serviceStatus = require('./service-status.js');

module.exports = app => {
    app.use('/', movies);
    app.use('/stats', stats);
    app.use('/service-status', serviceStatus);
};