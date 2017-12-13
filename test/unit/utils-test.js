'use strict';
/* jshint expr: true */

var mockery = require('mockery');
var sinon = require('sinon');
var _ = require('lodash');

describe('utils', function() {
    var utils;
    var couchbaseClientMock;
    var movieBucketMock;

    before(function() {
        mockery.enable({
            useCleanCache: true
        });
    });

    before(function() {
        movieBucketMock = {
            get: sinon.stub()
        };
        couchbaseClientMock = {
            getBucket: sinon.stub().returns(movieBucketMock)
        };
        mockery.registerAllowables(['../../lib/movie-utils.js', 'lodash', 'json2csv']);
        var config = {
            couchbase: {
                buckets: {}
            }

        };

        mockery.resetCache();
        mockery.deregisterAll();
        mockery.registerMock('config', config);
        mockery.registerMock('./logger.js', function() {
            return {error: sinon.stub()};
        });
        mockery.registerMock('./couchbase/client.js', couchbaseClientMock);
        utils = require('../../lib/movie-utils.js');
    });

    after(function() {
        mockery.deregisterAll();
        mockery.disable();
    });

    it('should work', function (){

    });
});