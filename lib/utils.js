'use strict';

var utils;
var config = require('config');
var json2csv = require('json2csv');
var _ = require('lodash');
var couchbase = require('couchbase');
var format = require('util').format;
var couchbaseClient = require('../lib/couchbase/client.js');

module.exports = utils = {

    filterByTitle: function(movieList, titleQuery) {
        return _.filter(movieList, function(movie) {
            return movie.title.toLowerCase().indexOf(titleQuery.toLowerCase()) > -1;
        });
    },
    filterByYear: function(movieList, yearQuery) {

    },
    filterByFormat: function(movieList, formatQuery) {

    },
    searchForMovies: function(requestParams, callback) {
        var movieBucket = couchbaseClient.getBucket(config.couchbase.buckets['movies'].name);
        var filteredList = [];

        movieBucket.get('uid_' + requestParams.uid + '_list', function(err, result) {
            if (err) {
                callback(err);
            }
            var movieList = result.value['movieList'];
            if (requestParams.title) {
                filteredList = filteredList.concat(filteredList, utils.filterByTitle(movieList, requestParams.title));
            }
            if (requestParams.year) {
                filteredList = filteredList.concat(filteredList, utils.filterByYear(movieList, requestParams.year))
            }
            if (requestParams.format) {
                filteredList = filteredList.concat(filteredList, utils.filterByFormat(movieList, requestParams.format))
            }
            callback(filteredList);
        });

    },
    exportMovieList: function(userId, callback) {
        var movieBucket = couchbaseClient.getBucket(config.couchbase.buckets['movies'].name);
        movieBucket.get('uid_' + userId + '_list', function(err, result) {
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