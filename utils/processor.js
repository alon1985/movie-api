'use strict';

const _ = require('lodash');
const dbUtils = require('../utils/dal.js');

let processor;

module.exports = processor = {
    getMovies: async function (id) {
        const results = await dbUtils.getMovies(id);
        return this.aggregateMovieResults(results);
    },
    searchMovies: async function(parameters) {
        const results = await dbUtils.searchMovies(parameters);
        return this.aggregateMovieResults(results);
    },
    deleteMovie: async function(id) {
        //TODO
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
        })
        return finalResults;
    }
}