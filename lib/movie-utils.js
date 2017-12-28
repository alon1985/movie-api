'use strict';

var movieUtils;
var utils = require('./utils.js');
var config = require('config');
var json2csv = require('json2csv');
var _ = require('lodash');

module.exports = movieUtils = {
    saveMovie: function (title, year, format, poster, userId) {
        var docKey = 'uid_' + userId + '_list';
        var movieList = [];
        var newMovie;
        return new Promise(function (resolve, reject) {
            utils.getCouchbaseDocument(docKey).then(function (result) {
                movieList = result['movieList'];
                newMovie = utils.getNewMovie(movieList, title, year, format, poster);
                movieList.push(newMovie);
                utils.upsertCouchbaseDocument(docKey, {movieList: movieList}).then(function (result) {
                    resolve(result);
                }).catch(function (insideError) {
                    reject(insideError);
                });
            }).catch(function (error) {
                if (error.code === 13) {
                    newMovie = utils.getNewMovie(movieList, title, year, format, poster);
                    movieList.push(newMovie);
                    utils.upsertCouchbaseDocument(docKey, {movieList: movieList}).then(function (result) {
                        resolve(result);
                    }).catch(function (insideError) {
                        reject(insideError);
                    });
                } else {
                    reject(error);
                }
            });
        });
    },
    saveMovieToWatchlist: function (title, releaseDate, poster, userId) {
        var docKey = 'uid_' + userId + '_watchlist';
        var newMovie;
        var movieList = [];
        return new Promise(function (resolve, reject) {
            utils.getCouchbaseDocument(docKey).then(function (result) {
                movieList = result['movieList'];
                newMovie = utils.getNewWatchlistMovie(movieList, title, releaseDate, poster);
                movieList.push(newMovie);
                utils.upsertCouchbaseDocument(docKey, {movieList: movieList}).then(function (result) {
                    resolve(result);
                }).catch(function (insideError) {
                    reject(insideError);
                });
            }).catch(function (error) {
                if (error.code === 13) {
                    newMovie = utils.getNewWatchlistMovie(movieList, title, releaseDate, poster);
                    movieList.push(newMovie);
                    utils.upsertCouchbaseDocument(docKey, {movieList: movieList}).then(function (result) {
                        resolve(result);
                    }).catch(function (insideError) {
                        reject(insideError);
                    });
                } else {
                    reject(error);
                }
            });
        });
    },
    getStats: function (userId) {
        var docKey = 'uid_' + userId + '_stats';
        var year = new Date().getFullYear().toString();
        var blankStats = {yearCounts: {}, formatCounts: {'In Theaters': 0, 'Video': 0}, formatsByYear: {}};
        blankStats.yearCounts[year] = 0;
        blankStats.formatsByYear[year] = {'Video': 0, 'In Theaters': 0};
        return new Promise(function (resolve, reject) {
            utils.getCouchbaseDocument(docKey).then(function (result) {
                resolve(result);
            }).catch(function (err) {
                if (err.code === 13) {
                    utils.upsertCouchbaseDocument(docKey, blankStats).then(function (result) {
                        resolve(blankStats);
                    }).catch(function (insideError) {
                        reject(insideError);
                    })
                }
                else {
                    reject(err);
                }
            });
        });
    },
    updateStats: function (format, year, userId) {
        var docKey = 'uid_' + userId + '_stats';
        return new Promise(function (resolve, reject) {
            movieUtils.getStats(userId).then(function (result) {
                var currentStats = result;
                currentStats = utils.updateStats(currentStats, format, year);
                utils.upsertCouchbaseDocument(docKey, currentStats).then(function (result) {
                    resolve(result);
                }).catch(function (err) {
                    reject(false);
                });
            }).catch(function (error) {
                reject(error);
            });
        });
    },
    getMovies: function (userId) {
        var docKey = 'uid_' + userId + '_list';
        return new Promise(function (resolve, reject) {
            utils.getCouchbaseDocument(docKey).then(function (result) {
                var returnValue = result['movieList'];
                resolve(returnValue)
            }).catch(function (error) {
                if (error.code === 13) {
                    utils.upsertCouchbaseDocument(docKey, {movieList: []}).then(function (result) {
                        resolve(result);
                    }).catch(function (insideError) {
                        reject(insideError);
                    })
                }
                else {
                    reject(error);
                }
            });
        });
    },

    getWatchlist: function (userId) {
        var docKey = 'uid_' + userId + '_watchlist';
        return new Promise(function (resolve, reject) {
            utils.getCouchbaseDocument(docKey).then(function (result) {
                var returnValue = result['movieList'];
                resolve(returnValue)
            }).catch(function (error) {
                if (error.code === 13) {
                    utils.upsertCouchbaseDocument(docKey, {movieList: []}).then(function (result) {
                        resolve(result);
                    }).catch(function (insideError) {
                        reject(insideError);
                    })
                }
                else {
                    reject(error);
                }
            });
        });
    },
    searchForMovies: function (requestParams) {
        var filteredList = [];
        var docKey = 'uid_' + requestParams.uid + '_list';
        return new Promise(function (resolve, reject) {
            utils.getCouchbaseDocument(docKey).then(function (result) {
                var movieList = result['movieList'];
                var titleList = utils.filterByTitle(movieList, requestParams.title);
                var yearList = utils.filterByYear(movieList, parseInt(requestParams.year));
                var formatList = utils.filterByFormat(movieList, requestParams.format);
                filteredList = _.intersection(titleList, yearList, formatList);
                var result = _(_.sortBy(filteredList, function (title) {
                    return _.max(_.map(title.seen, 'seen'))
                })).reverse();
                resolve(result);
            }).catch(function (error) {
                reject(error);
            });
        });
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
            var csv = json2csv({data: newListObject, fields: cellHeaders, del: '\t'});
            callback(csv);
        }).catch(function (err) {
            callback(err);
        })
    }
};
