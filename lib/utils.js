'use strict';

var utils;
var config = require('config');
var json2csv = require('json2csv');
var _ = require('lodash');
var couchbase = require('couchbase');
var couchbaseClient = require('../lib/couchbase/client.js');

module.exports = utils = {

    filterByTitle: function (movieList, titleQuery) {
        return _.filter(movieList, function (movie) {
            return movie.title.toLowerCase().indexOf(titleQuery.toLowerCase()) > -1;
        });
    },
    filterByYear: function (movieList, yearQuery) {


        return _.reduce(movieList, function (result, value) {
            if (_.filter(value.seen, function (screening) {
                    return screening.seen === yearQuery
                }).length > 0) {
                result.push(value);
            }
            return result;
        }, []);
    },
    filterByFormat: function (movieList, formatQuery) {
        return _.reduce(movieList, function (result, value) {
            if (_.filter(value.seen, function (screening) {
                    return screening.format === formatQuery
                }).length > 0) {
                result.push(value);
            }

            return result;
        }, []);
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
            if (requestParams.title) {
                filteredList = utils.filterByTitle(movieList, requestParams.title);
            }
            if (requestParams.year) {
                var yearFilter = utils.filterByYear(movieList, parseInt(requestParams.year));
                if (filteredList.length > 0) {
                    filteredList = _.intersection(filteredList, yearFilter);
                }
                else {
                    filteredList = yearFilter;
                }

            }
            if (requestParams.format) {
                var formatFilter = utils.filterByFormat(movieList, requestParams.format);
                if (filteredList.length > 0) {
                    filteredList = _.intersection(filteredList, formatFilter);
                }
                else {
                    filteredList = formatFilter;
                }
            }
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
