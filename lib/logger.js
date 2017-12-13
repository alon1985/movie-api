function createLogger() {
    var pino = require('pino');
    var logger = pino({
        name: 'cinemaFile',
        safe: true,
        serializers: {
            req: pino.stdSerializers.req,
            res: pino.stdSerializers.res
        }
    });
    return logger;
};
module.exports = createLogger();