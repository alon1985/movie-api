'use strict';

var utils;
var config = require('config');
var json2csv = require('json2csv');
var _ = require('lodash');
var couchbase = require('couchbase');
var couchbaseClient = require('../lib/couchbase/client.js');

module.exports = utils = {
    saveMovie: function (title, date, format, userId, callback) {
        var movieBucket = couchbaseClient.getBucket(config.couchbase.buckets['movies'].name);
        movieBucket.get('uid_' + userId + '_list', function (err, result) {
            if (err) {
                callback(err);
            }
            var movieList = result.value['movieList'];
            var newMovie;
            var filteredMovies = _.remove(movieList, function (movie) {
                return movie.title === title;
            });
            if (filteredMovies.length > 0) {
                newMovie = filteredMovies[0];
                newMovie.seen.push({format: format, seen: date});
            } else {
                newMovie = {title: title, seen: [{format: format, seen: date}]};
            }
            movieList.push(newMovie);
            movieBucket.upsert('uid' + userId + '_list', {movieList: movieList}, function (err, result) {
                if (err) {
                    callback(err);
                }
                callback(true)
            });
        })
    },

    filterByTitle: function (movieList, titleQuery) {
        if (titleQuery) {
            return _.filter(movieList, function (movie) {
                return movie.title.toLowerCase().indexOf(titleQuery.toLowerCase()) > -1;
            });
        } else {
            return movieList;
        }
    },

    getStats: function (userId, callback) {
        var movieBucket = couchbaseClient.getBucket(config.couchbase.buckets['movies'].name);
        movieBucket.get('uid_' + userId + '_stats', function (err, result) {
            if (err) {
                callback(err);
            }
            callback(result.value);
        });
    },
    calculateStats: function (userId, callback) {
        var movieBucket = couchbaseClient.getBucket(config.couchbase.buckets['movies'].name);
        movieBucket.get('uid_' + userId + '_stats', function (err, result) {
            if (err) {
                callback(err);
            }
            callback(result.value);
        });
    },
    searchForMovies: function (requestParams, callback) {
        var movieBucket = couchbaseClient.getBucket(config.couchbase.buckets['movies'].name);
        var filteredList = [];

        movieBucket.get('uid_' + requestParams.uid + '_list', function (err, result) {
            if (err) {
                callback(err);
            }
            var movieList = result.value['movieList'];
            var titleList = utils.filterByTitle(movieList, requestParams.title);
            filteredList = _(_.sortBy(titleList, function (title) {
                return _.max(_.map(title.seen, 'seen'))
            })).reverse();
            callback(filteredList);
        });

    },
    exportMovieList: function (userId, callback) {
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
};
