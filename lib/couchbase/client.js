'use strict';

var Bucket = require('./bucket.js');
var couchbase = require('couchbase');
var config = require('config');

module.exports = new CouchbaseClient();

function CouchbaseClient() {
    if (!config.couchbase || !config.couchbase.cluster) {
        throw new Error('Couchbase cluster configuration not found at config.couchbase.cluster');
    }

    var cluster = new couchbase.Cluster(config.couchbase.cluster);
    var _buckets = {};

    this.getBucket = function (bucketName) {
        if (!bucketName) {
            throw new Error('Must provide bucket name');
        }

        if (_buckets[bucketName]) {
            return _buckets[bucketName];
        }

        var bucket = new Bucket(cluster, bucketName);
        _buckets[bucketName] = bucket;

        return bucket;
    };

    return this;
}