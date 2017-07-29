'use strict';

var config = require('config');
var logger = require('../logger.js');

var EVENTS = Object.freeze({
    BUCKET_CONNECTED: 'bucket_connected',
    BUCKET_RECONNECT: 'bucket_reconnect',
    BUCKET_NOT_CONNECTED: 'bucket_not_connected'
});

function Bucket(cluster, bucketName) {
    var self = this;
    var configBucket = config.couchbase.buckets[bucketName];

    if (!configBucket) {
        var message = 'No configuration found for Bucket "' + bucketName + '".';
        logger.error(message);
        throw new Error(message);
    }

    function connect() {
        self.bucket = cluster.openBucket(configBucket.name, configBucket.password, function () {

            self.bucket.on('error', function (err) {
                /**
                 * Couchbase Error Codes which trigger reconnect
                 * The codes are translated from hex from the C library
                 * https://github.com/couchbase/libcouchbase/blob/master/include/libcouchbase/error.h
                 */
                var reconnectOnCodeList = [11, 16, 23, 44, 45, 46];
                if (!self.bucket.connected && reconnectOnCodeList.indexOf(err.code) !== -1) {
                    logger.warn('Reconnecting due to error code ' + err.code);
                    self.bucket.emit(EVENTS.BUCKET_RECONNECT, err.code);
                    connect();
                } else {
                    var message = 'Could not reach couchbase due to error ' + JSON.stringify(err);
                    logger.error(message);
                    throw err;
                }
            });
            if (self.bucket.connected === true) {
                self.bucket.emit(EVENTS.BUCKET_CONNECTED, 'Connected to ' + configBucket.name);
            } else {
                //this condition is true when the bucket isn't connected due to some networking
                //error, and the emit('error') has fired, but the handler hasn't picked it
                //up from the event loop yet
                self.bucket.emit(EVENTS.BUCKET_NOT_CONNECTED, 'Could not connect to ' + configBucket.name);
            }
        });
        self.bucket.operationTimeout = config.couchbase.operationTimeout || 120000;
        self.bucket.connectionTimeout = config.couchbase.connectionTimeout || 120000;
        self.bucket.EVENTS = EVENTS;
    }

    connect();
    return self.bucket;
}

module.exports = Bucket;