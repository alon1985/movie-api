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
    filterByYear: function (movieList, yearQuery) {
        if (yearQuery) {
            return _.reduce(movieList, function (result, value) {
                if (_.filter(value.seen, function (screening) {
                        return screening.seen === yearQuery
                    }).length > 0) {
                    result.push(value);
                }
                return result;
            }, []);
        } else {
            return movieList;
        }
    },
    filterByFormat: function (movieList, formatQuery) {
        if (formatQuery) {
            return _.reduce(movieList, function (result, value) {
                if (_.filter(value.seen, function (screening) {
                        return screening.format === formatQuery
                    }).length > 0) {
                    result.push(value);
                }

                return result;
            }, []);
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
    searchForMovies: function (requestParams, callback) {
        var movieBucket = couchbaseClient.getBucket(config.couchbase.buckets['movies'].name);
        var filteredList = [];

        movieBucket.get('uid_' + requestParams.uid + '_list', function (err, result) {
            if (err) {
                callback(err);
            }
            var movieList = result.value['movieList'];
            filteredList = movieList;
            var titleList = utils.filterByTitle(movieList, requestParams.title);
            var yearList = utils.filterByYear(movieList, parseInt(requestParams.year));
            var formatList = utils.filterByFormat(movieList, requestParams.format);
            filteredList = _.intersection(titleList, yearList, formatList);
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
