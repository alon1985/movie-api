'use strict';

var couchbase = require('couchbase');
var config = require('config');

module.exports = new CouchbaseClient();

function CouchbaseClient() {

    if (!config.couchbase || !config.couchbase.cluster) {
        throw new Error('Couchbase cluster configuration not found at config.couchbase.cluster');
    }

    const cluster = new couchbase.Cluster("config.couchbase.cluster", {
        username: "admin",
        password: "al3185on10",
    });

    var _buckets = {};

    this.getBucket = function (bucketName) {
        if (!bucketName) {
            throw new Error('Must provide bucket name');
        }

        if (_buckets[bucketName]) {
            return _buckets[bucketName];
        }

        return cluster.bucket("movies");

    }
    return this;
}