'use strict';

var utils;
var config = require('config');
var couchbase = require('couchbase');
var couchbaseClient = require('./couchbase/client.js');
var Promise = require('bluebird');
var _ = require('lodash');
var movieBucket = couchbaseClient.getBucket(config.couchbase.buckets['movies'].name);

module.exports = utils = {
    getCouchbaseDocument: function (key) {
        return new Promise(function (resolve, reject) {
            movieBucket.get(key, function (err, result) {
                if (err) {
                    return reject(err);
                }
                resolve(result.value);
            })
        });
    },
    upsertCouchbaseDocument: function(key, doc) {
        return new Promise(function (resolve, reject) {
            movieBucket.upsert(key, doc, function(err, result) {
                if (err) {
                    return reject(err);
                }
                resolve(true);
            })
        });
    },
    updateStats: function (method, currentStats, format, year) {
        var counter = method == "add" ? 1 : -1;
        currentStats.yearCounts[year] = currentStats.yearCounts[year] + counter;
        if (format === 'In Theaters') {
            currentStats.formatCounts['In Theaters'] = currentStats.formatCounts['In Theaters'] + counter;
            currentStats.formatsByYear[year]['In Theaters'] = currentStats.formatsByYear[year]['In Theaters'] + counter;
        } else {
            currentStats.formatCounts['Video'] = currentStats.formatCounts['Video'] + counter;
            currentStats.formatsByYear[year]['Video'] = currentStats.formatsByYear[year]['Video'] + counter;
        }
        return currentStats;
    },
    getNewMovie: function (movieList, title, year, format, poster, plot) {
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
            if (newMovie.plot != plot) {
                newMovie.plot = plot;
            }
        } else {
            newMovie = {title: title, seen: [{format: format, seen: parseInt(year)}], poster: poster, plot: plot};
        }
        return newMovie;
    },
    getNewWatchlistMovie: function (movieList, title, releaseDate, poster, plot) {
        var newMovie;
        var filteredMovies = _.remove(movieList, function (movie) {
            return movie.title === title;
        });
        if (filteredMovies.length > 0) {
            newMovie = filteredMovies[0];
            newMovie.releaseDate = releaseDate
        } else {
            newMovie = {title: title, releaseDate: releaseDate, poster: poster, plot: plot};
        }
        return newMovie;
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
    }
};
