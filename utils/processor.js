'use strict';

const _ = require('lodash');
const dbUtils = require('../utils/dal.js');

let processor;

module.exports = processor = {
    getMovie: async function (id) {
        const results = await dbUtils.getMovie(id);
        return this.aggregateMovieResults(results);
    },
    getMovies: async function(parameters) {
        const results = await dbUtils.getMovies(parameters);
        return this.aggregateMovieResults(results);
    },
    getWatchlistMovies: async function() {
        const results = await dbUtils.getWatchlistMovies();
        return this.aggregateMovieResults(results);
    },
    deleteMovie: async function(id, isWatchlist) {
        //should delete from movie db and then cascade to seen db
    },
    saveMovieSeen: async function(title, year, format, poster, plot) {
        //save individual movie - get id
        //save into seen
    },
    _saveMovie: async function () {
        //save individual movie
        //return id
    },
    exportMovies: async function () {
        //get movies
        /*
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
         */
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


        _.map(await Promise.allSettled(Object.keys(yearCounts).map(async (year) => {
            const yearStat = await dbUtils.getFormatStatsByYear(year);
            return yearStat;
        })), (result) => {
            formatsByYear[Object.keys(result.value)[0]] = {};
            _.forEach(Object.values(result.value)[0], (resultObject) => {
                const format = resultObject.format;
                const count = resultObject.count;
                formatsByYear[Object.keys(result.value)[0]][format] = count;
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
        return finalResults;
    }
};