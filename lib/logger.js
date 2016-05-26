/**
 * @returns {bunyan.Logger}
 */
function createLogger() {
    var config = require('config');
    var bunyan = require('bunyan');
    var bunyanConfig = require('bunyan-config')(config.logger);
    var logger = bunyan.createLogger(bunyanConfig);
    return logger;
}

module.exports = createLogger();