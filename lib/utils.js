'use strict';

var utils;
var config = require('config');
var json2csv = require('json2csv');
var _ = require('lodash');
var couchbase = require('couchbase');
var couchbaseClient = require('../lib/couchbase/client.js');

module.exports = utils = {
    saveMovie: function (title, year, format, poster, userId, callback) {
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
                newMovie.seen.push({format: format, seen: parseInt(year)});
            } else {
                newMovie = {title: title, seen: [{format: format, seen: parseInt(year)}], poster: poster};
            }
            movieList.push(newMovie);
            movieBucket.upsert('uid_' + userId + '_list', {movieList: movieList}, function (err, result) {
                if (err) {
                    callback(err);
                }
                callback(true);
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
    updateStats: function (format, year, userId, callback) {
        var movieBucket = couchbaseClient.getBucket(config.couchbase.buckets['movies'].name);
        movieBucket.get('uid_' + userId + '_stats', function (err, result) {
            if (err) {
                callback(err);
            }
            var currentStats = result.value;
            currentStats.yearCounts[year] = currentStats.yearCounts[year] + 1;
            if (format === 'In Theaters') {
                currentStats.formatCounts['In Theaters'] = currentStats.formatCounts['In Theaters'] + 1;
                currentStats.formatsByYear[year]['In Theaters'] = currentStats.formatsByYear[year]['In Theaters'] + 1;
            } else {
                currentStats.formatCounts['Video'] = currentStats.formatCounts['Video'] + 1;
                currentStats.formatsByYear[year]['Video'] = currentStats.formatsByYear[year]['Video'] + 1;
            }
            movieBucket.upsert('uid_' + userId + '_stats', currentStats, function (err, result) {
                if (err) {
                    callback(err);
                }
                callback(true)
            });
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
