'use strict';

var utils;
var config = require('config');
var couchbaseClient = require('./couchbase/client.js');
var Promise = require('bluebird');
var _ = require('lodash');
var movieBucket = couchbaseClient.getBucket(config.couchbase.buckets['movies-dev'].name);
var _IN_THEATERS = 'In Theaters';
var _VIDEO = 'Video';

module.exports = utils = {
    getCouchbaseDocument: function (key) {
        return new Promise(function (resolve, reject) {
            movieBucket.get(key, function (err, result) {
                if (err) {
                    return reject(err.message);
                }
                resolve(result.value);
            })
        });
    },
    upsertCouchbaseDocument: function(key, doc) {
        return new Promise(function (resolve, reject) {
            movieBucket.upsert(key, doc, function(err) {
                if (err) {
                    return reject(err.message);
                }
                resolve(true);
            })
        });
    },
    updateYearCounts: function (counter, stats, year) {
        if (Number.isInteger(stats.yearCounts[year])) {
            stats.yearCounts[year] = stats.yearCounts[year] + counter;
        } else if (counter > 0) {
            stats.yearCounts[year] = 1;
        }
        if (stats.yearCounts[year] == 0) {
            delete stats.yearCounts[year];
        }
        return stats.yearCounts;
    },
    updateFormatsByYear: function (counter, stats, format, year) {
        if (format === _IN_THEATERS) {
            if (stats.formatsByYear[year]) {
                if (Number.isInteger(stats.formatsByYear[year][_IN_THEATERS])) {
                    stats.formatsByYear[year][_IN_THEATERS] = stats.formatsByYear[year][_IN_THEATERS] + counter;
                } else if (counter > 0) {
                    stats.formatsByYear[year][_IN_THEATERS] = 1;
                }
            } else if (counter > 0) {
                stats.formatsByYear[year] = {};
                stats.formatsByYear[_VIDEO] = 0;
                stats.formatsByYear[_IN_THEATERS] = 1;
            }
        } else {
            if (stats.formatsByYear[year]) {
                if (Number.isInteger(stats.formatsByYear[year][_VIDEO])) {
                    stats.formatsByYear[year][_VIDEO] = stats.formatsByYear[year][_VIDEO] + counter;
                } else if (counter > 0) {
                    stats.formatsByYear[year][_VIDEO] = 1;
                }
            } else if (counter > 0) {
                stats.formatsByYear[year] = {};
                stats.formatsByYear[year][_VIDEO] = 1;
                stats.formatsByYear[year][_IN_THEATERS] = 0;
            }
        }
        if (stats.formatsByYear[year][_IN_THEATERS] == 0 && stats.formatsByYear[year][_VIDEO] == 0) {
            delete stats.formatsByYear[year];
        }
        return stats.formatsByYear;
    },
    updateStats: function (method, currentStats, format, year) {
        var counter = method == 'add' ? 1 : -1;
        currentStats.yearCounts = utils.updateYearCounts(counter, currentStats, year);
        if (format === _IN_THEATERS) {
            currentStats.formatCounts[_IN_THEATERS] = currentStats.formatCounts[_IN_THEATERS] + counter;
        } else {
            currentStats.formatCounts[_VIDEO] = currentStats.formatCounts[_VIDEO] + counter;
        }
        currentStats.formatsByYear = utils.updateFormatsByYear(counter, currentStats, format, year);
        return currentStats;
    },
    getNewMovie: function (movieList, title, year, format, poster, plot) {
        var newMovie;
        var filteredMovies = _.remove(movieList, function (movie) {
            var releaseYear = movie.plot.substring(0, 3);
            return ((movie.plot === "    " || releaseYear === plot.substring(0, 3)) &&
                movie.title.localeCompare(title, 'en', {sensitivity: 'base'})===0)
        });
        if (filteredMovies.length > 0) {
            newMovie = filteredMovies[0];
            newMovie.seen.push({format: format, seen: parseInt(year)});
            newMovie.poster = poster;
            newMovie.plot = plot;
        } else {
            newMovie = {title: title, seen: [{format: format, seen: parseInt(year)}], poster: poster, plot: plot};
        }
        return newMovie;
    },
    getNewWatchlistMovie: function (movieList, title, releaseDate, poster, plot) {
        var newMovie;
        var filteredMovies = _.remove(movieList, function (movie) {
            return movie.title.localeCompare(title, 'en', {sensitivity: 'base'})===0;
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
