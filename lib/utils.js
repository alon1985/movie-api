'use strict';

var utils;
var config = require('config');
var json2csv = require('json2csv');
var _ = require('lodash');
var couchbase = require('couchbase');
var N1qlQuery = couchbase.N1qlQuery;
var format = require('util').format;


module.exports = utils = {

    getQuery: function (queryParams) {
        var searchQuery;
        if (queryParams.title) {
            searchQuery = format(config.searchQuery, 'Title', "'%" + queryParams.title + "%'");
        } else if (queryParams.year) {
            searchQuery = format(config.searchQuery, 'Year', "'%" + queryParams.year + "%'");
        } else if (queryParams.format) {
            searchQuery = format(config.searchQuery, 'Format', "'%" + queryParams.format + "%'");
        }
        return searchQuery;
    },
    searchForMovies: function (requestParams, callback) {
        var couchbaseClient = require('./couchbase/client.js');
        var movieBucket = couchbaseClient.getBucket(config.couchbase.buckets['movies'].name);
        var searchQuery = utils.getQuery(requestParams);
        var query = N1qlQuery.fromString(searchQuery);
        movieBucket.query(query, function (err, rows) {
            if (err) {
                return callback(err);
            }
            callback(rows);
        });

    },
    exportMovieList: function (userId, callback) {
        var couchbaseClient = require('../lib/couchbase/client.js');
        var movieBucket = couchbaseClient.getBucket(config.couchbase.buckets['movies'].name);
        movieBucket.get('uid_' + userId + '_list', function (err, result) {
            if (err) {
                callback(err);
            }
            var movieList = result.value['movie_list'];
            var cellHeaders = ['Title', 'Format', 'Year'];
            var csv = json2csv({data: movieList, fields: cellHeaders, del: ','});
            callback(csv);
        });
    }
}