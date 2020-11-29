'use strict';

const _ = require('lodash');
const dbUtils = require('../utils/dal.js');
const json2csv = require('json2csv');

let processor;

module.exports = processor = {
    getMovie: async function (id) {
        const results = await dbUtils.getMovie(id);
        if (results.length > 0) {
            return this.aggregateMovieResults(results);
        }
        return [];
    },
    getMovies: async function(parameters) {
        const results = await dbUtils.getMovies(parameters);
        if (results.length > 0) {
            return this.aggregateMovieResults(results);
        }
        return [];
    },
    getWatchlistMovies: async function() {
        const results = await dbUtils.getWatchlistMovies();
        const formattedResults = [];
        _.forEach(results, (movie) => {
            formattedResults.push({
                title: movie.name,
                releaseDate: movie.releasedate,
                poster: movie.poster,
                movieId: movie.movieid,
                plot: movie.description
            })
        });
        return formattedResults;
    },
    getWatchlistMovie: async function (id) {
        const results = await dbUtils.getWatchlistMovie(id);
        return results[0];
    },
    deleteMovie: async function(id, isWatchlist) {
        const results = await dbUtils.deleteMovie(id, isWatchlist);
        return {
            status: 'success',
            result: results
        };
    },
    saveMovieSeen: async function(existingMovieId, title, year, format, poster, plot) {
        if(!existingMovieId) {
            existingMovieId = await processor._saveMovie(title, poster, plot);
        }
        if(existingMovieId) {
            const results = await processor.saveViewRecord(existingMovieId, year, format);
            return {
                status: 'success',
                result: {
                    movieId: existingMovieId,
                    movieSeenRecordId: results
                }
            };
        }
        return {
            status: 'failed to save movie (seen record not attempted)',
            result: result
        }
    },
    saveMovieToWatchlist: async function(title, releaseDate, poster, plot) {
        const newMovieId = await processor._saveMovie(title, poster, plot)
        if(newMovieId) {
            const results = await dbUtils.saveToWatchlist(newMovieId, releaseDate);
            return {
                status: 'success',
                result: {
                    movieId: newMovieId,
                    movieWatchlistRecord: results
                }

            }
        }
        return {
            status: 'failed to save movie to watchlist (seen record not attempted)',
            result: result
        };
    },
    _saveMovie: async function (title, poster, plot) {
        const newMovieId = await dbUtils.saveMovie(title, poster, plot);
        return newMovieId;
    },
    saveViewRecord: async function (movieId, year, format) {
      return await dbUtils.saveViewRecord(movieId, year, format);
    },
    exportMovies: async function (parameters) {
        const movieList = await processor.getMovies(parameters)
        const newListObject = [];
        _.forEach(movieList, function (movie) {
                const newMovie = {
                    'Title': movie.title,
                    'Format': _.join(_.map(_.map(movie.seen, g => _.pick(g, 'format')), m => m.format), ' || '),
                    'Year': _.join(_.map(_.map(movie.seen, g => _.pick(g, 'year')), m => m.year), ' || ')
                };
                newListObject.push(newMovie);
            });
            const cellHeaders = ['Title', 'Format', 'Year'];
            const csv = json2csv({data: newListObject, fields: cellHeaders, del: '\t'});
            return csv;
    },
    getYearStats: async function (year) {
        const results = await dbUtils.getYearStats(year);
        return results;
    },
    getFormatStats: async function (format) {
        const results = await dbUtils.getFormatStats(format);
        return results;
    },
    getStats: async function () {
        const yearStats = await dbUtils.getYearStats();
        const formatStats = await dbUtils.getFormatStats();


        let yearCounts = {};
        let formatCounts = {};
        let formatsByYear = {};

        _.forEach(yearStats, (yearStat) => {
            yearCounts[yearStat.year] = yearStat.count
        });

        _.forEach(formatStats, (formatStat) => {
            formatCounts[formatStat.format] = formatStat.count
        });


        const results =  _.map(await Promise.allSettled(Object.keys(yearCounts).map(async (year) => {
                return await dbUtils.getFormatStatsByYear(year);})), (result) => result.value );

        _.forEach(Object.keys(yearCounts), (year, index) => {
            formatsByYear[year] = {};
            _.forEach(results[index], (result) => {
                if(result.format === 'Video') {
                    formatsByYear[year].Video = result.count;
                } else {
                    formatsByYear[year]['In Theaters'] = result.count;
                }
            })
        });

        return {
            yearCounts,
            formatCounts,
            formatsByYear
        };
    },
    aggregateMovieResults: function (results) {
        const groupedResults = _.groupBy(results, 'id');
        const finalResults = [];
        _.forEach(groupedResults, (group) => {
            const seenFormats = _.map(group, g => _.pick(g, 'year', 'format'))
            const basicInfo = _.map(group, g => _.pick(g, 'name', 'poster', 'description', 'id'))[0];
            const finalResult = Object.assign({}, basicInfo);
            finalResults.push({
                plot: finalResult.description,
                id: finalResult.id,
                title: finalResult.name,
                poster: finalResult.poster,
                seen: seenFormats
            });
        });
        return _.reverse(finalResults);
    }
};