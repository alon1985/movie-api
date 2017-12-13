'use strict';

var movieUtils;
var utils = require('./utils.js');
var config = require('config');
var json2csv = require('json2csv');
var _ = require('lodash');

module.exports = movieUtils = {
    saveMovie: function (title, year, format, poster, userId, callback) {
        var docKey = 'uid_' + userId + '_list';
        utils.getCouchbaseDocument(docKey).then(function (result) {
            var movieList = result['movieList'];
            var newMovie;
            var filteredMovies = _.remove(movieList, function (movie) {
                return movie.title === title;
            });
            if (filteredMovies.length > 0) {
                newMovie = filteredMovies[0];
                newMovie.seen.push({format: format, seen: parseInt(year)});
                if (newMovie.poster != poster) {
                    newMovie.poster = poster;
                }
            } else {
                newMovie = {title: title, seen: [{format: format, seen: parseInt(year)}], poster: poster};
            }
            movieList.push(newMovie);
            utils.upsertCouchbaseDocument(docKey, {movieList: movieList}).then(function () {
                callback(true);
            }).catch(function () {
                callback(false);
            });
        });
    },

    getStats: function (userId, callback) {
        var docKey = 'uid_' + userId + '_stats';
        utils.getCouchbaseDocument(docKey).then(function (result) {
            callback(result);
        }).catch(function (err) {
            callback(err);
        });
    },
    updateStats: function (format, year, userId, callback) {
        var docKey = 'uid_' + userId + '_stats';
        utils.getCouchbaseDocument(docKey).then(function (result) {
            var currentStats = result;
            currentStats.yearCounts[year] = currentStats.yearCounts[year] + 1;
            if (format === 'In Theaters') {
                currentStats.formatCounts['In Theaters'] = currentStats.formatCounts['In Theaters'] + 1;
                currentStats.formatsByYear[year]['In Theaters'] = currentStats.formatsByYear[year]['In Theaters'] + 1;
            } else {
                currentStats.formatCounts['Video'] = currentStats.formatCounts['Video'] + 1;
                currentStats.formatsByYear[year]['Video'] = currentStats.formatsByYear[year]['Video'] + 1;
            }
            utils.upsertCouchbaseDocument(docKey, currentStats).then(function (result) {
                callback(result);
            }).catch(function (err) {
                callback(false);
            });
        });
    },
    searchForMovies: function (requestParams, callback) {
        var filteredList = [];
        var docKey = 'uid_' + requestParams.uid + '_list';
        utils.getCouchbaseDocument(docKey).then(function (result) {
            var movieList = result['movieList'];
            var titleList = utils.filterByTitle(movieList, requestParams.title);
            var yearList = utils.filterByYear(movieList, parseInt(requestParams.year));
            var formatList = utils.filterByFormat(movieList, requestParams.format);
            filteredList = _.intersection(titleList, yearList, formatList);
            filteredList = _(_.sortBy(filteredList, function (title) {
                return _.max(_.map(title.seen, 'seen'))
            })).reverse();
            callback(filteredList);

        }).catch(function () {
            callback(false);
        })
    },
    exportMovieList: function (userId, callback) {
        var docKey = 'uid_' + userId + '_list';
        var newListObject = [];
        utils.getCouchbaseDocument(docKey).then(function (result) {
            var movieList = result['movieList'];
            _.forEach(movieList, function (movie) {
                var newMovie = {
                    'Title': movie.title,
                    'Format': _.flatMap(movie.seen, 'format').length > 1 ? _.join(_.flatMap(movie.seen, 'format'), ' || ') : movie.seen[0].format,
                    'Year': _.flatMap(movie.seen, 'seen').length > 1 ? _.join(_.flatMap(movie.seen, 'seen'), ' || ') : movie.seen[0].seen,
                };
                newListObject.push(newMovie);
            });
            var cellHeaders = ['Title', 'Format', 'Year'];
            var csv = json2csv({data: newListObject, fields: cellHeaders, quotes: ''});
            callback(csv);
        }).catch(function (err) {
            callback(err);
        })
    }
};
