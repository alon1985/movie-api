'use strict';

const { Pool, Client } = require('pg');
const _ = require('lodash');
const connectionString = 'postgresql://localhost/alon'
const pool = new Pool({
    connectionString,
})
const client = new Client({
    connectionString,
})
client.connect();
let dbUtils;

module.exports = dbUtils = {
    getMovie: async function (id) {
        const whereClause = _.isEmpty(id) ? '' : `where movies.id = ${id}`;
        const records = `select a.name, a.id, a.poster, a.description, a.year, format from (
                           select name, movies.id, poster, description, year, formatId
                           from movies
                           inner join seen on seen.movieid = movies.id
                            ${whereClause}) as a
                           inner join formats on formats.id = a.formatId`;

        return await dbUtils.getRecords(records);
    },
    getMovies: async function (parameters) {
        const titleClause = _.isEmpty(parameters.title) ? '' : `where movies.name ilike '%${parameters.title}%'`;
        const formatClause = _.isEmpty(parameters.format) ? '' : `where format = '${parameters.format}'`;
        let yearClause = _.isEmpty(parameters.year) ? '' : ` year = ${parameters.year}`;
        if(!_.isEmpty(yearClause)) {
            yearClause = _.isEmpty(titleClause) ? yearClause : `and ${yearClause}`;
        }

        const query = `select a.name, a.id, a.poster, a.description, a.year, format from (
                       select name, movies.id, poster, description, year, formatId
                       from movies
                       inner join seen on seen.movieid = movies.id
                       ${titleClause} ${yearClause}) as a
                       inner join formats on formats.id = a.formatId
                       ${formatClause}`;

        return await dbUtils.getRecords(query);
    },
    getWatchlistMovies: async function () {

    },
    getYearStats: async function(year) {
        const whereClause = _.isEmpty(year) ? '' : `where year = ${year}`;
        const records = `select year, count(year)::INTEGER from seen ${whereClause} group by year order by year`;
        return await dbUtils.getRecords(records);
    },
    getFormatStats: async function (format) {
        const whereClause = _.isEmpty(format) ? '' : `where format = '${format}'`;
        const records = `select format, s.formatCount::INTEGER as count from (
                         select formatId as id, count(formatId) as formatCount from seen group by formatId) as s
                         inner join formats on formats.id = s.id ${whereClause}`;

        return await dbUtils.getRecords(records);
    },
    getFormatStatsByYear: async function(year) {
        const records = `select format, a.count::INTEGER as count from
                         (select formatid, count(formatId) as count from seen where year = ${year} group by formatId)as a
                         inner join formats on formats.id = a.formatid`;

        return await dbUtils.getRecords(records);
    },
    getRecords: async function (queryText) {
        try {
            let {rows: results} = await client.query(queryText);
            return results;
        } catch (e) {
            console.error('problem retrieving records', e);
        }
    },
}