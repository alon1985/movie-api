'use strict';

const { Client } = require('pg');
const _ = require('lodash');
const fs = require('fs');

console.log(`env: ${process.env.NODE_ENV}`)

if(process.env.NODE_ENV === 'production') {
    const config = {
        database: 'movie-db',
        host: process.env.DATABASE_HOST,
        user: 'movie-db',
        password: process.env.DATABASE_PASSWORD,
        port: process.env.DATABASE_PORT,
        // this object will be passed to the TLSSocket constructor
        ssl: {
            rejectUnauthorized: false,
            ca: fs.readFileSync(__dirname + '/ca-certificate.crt').toString(),
        },
    }


    const client = new Client(config)
    console.log('trying to connect');
    client.connect(err => {
        if (err) {
            console.error('error connecting', err.stack)
        } else {
            console.log('connected')
        }
    })
} else {
    const connectionString = 'postgresql://localhost/alon'

    const client = new Client({
        connectionString,
    })
    client.connect();

}

const regex = /'/gi;
let dbUtils;

module.exports = dbUtils = {
    getMovie: async function (id) {
        const whereClause = _.isEmpty(id) ? '' : `where movies.id = ${id}`;
        const query = `select a.name, a.id, a.poster, a.description, a.year, format from (
                           select name, movies.id, poster, description, year, formatId
                           from movies
                           inner join movies_seen on movies_seen.movieid = movies.id
                            ${whereClause}) as a
                           inner join formats on formats.id = a.formatId`;

        return await dbUtils.executeQuery([query]);
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
                       inner join movies_seen on movies_seen.movieid = movies.id
                       ${titleClause} ${yearClause}) as a
                       inner join formats on formats.id = a.formatId
                       ${formatClause}`;

        return await dbUtils.executeQuery([query]);
    },
    getWatchlistMovies: async function () {
        const query = `select a.name, a.id as movieId, a.poster, a.description, releaseDate from (
                       select name, movies.id, poster, description from movies) as a
                       inner join watchlist on watchlist.movieId = a.id`;
        return await dbUtils.executeQuery([query]);
    },
    getWatchlistMovie: async function (id) {
        const query = `select a.name, a.id as movieId, a.poster, a.description, releaseDate from (
                       select name, movies.id, poster, description from movies) as a
                       inner join watchlist on watchlist.movieId = a.id
                       where watchlist.id = ${id}`;
        return await dbUtils.executeQuery([query]);
    },
    saveMovie: async function (title, poster, plot) {
        const titleClause = title.replace(regex, "''");
        const posterClause = poster.replace(regex, "''");
        const plotClause = plot.replace(regex, "''");
        const query = `insert into movies (name, poster, description) 
                       values ('${titleClause}', '${posterClause}', '${plotClause}') RETURNING id`;
        const results = await dbUtils.executeQuery([query], true);
        return results[0].id;
    },
    saveToWatchlist: async function (movieId, releaseDate) {
        const query = `insert into watchlist(movieId, releaseDate) 
                    values (${movieId}, '${releaseDate}') RETURNING id`
        const results = await dbUtils.executeQuery([query], true);
        return results[0].id;
    },
    saveViewRecord: async function (movieId, year, format) {
        const query = `insert into movies_seen (movieid, formatid, year) 
                        values (${movieId}, (select id from formats where format ilike '%${format}%'), ${year}) RETURNING id`;
        const results = await dbUtils.executeQuery([query], true);
        return results[0].id;
    },
    deleteMovie: async function (movieId, isWatchlist) {
        const fromClause = isWatchlist ? 'from watchlist' : 'from movies_seen';
        const query = `delete ${fromClause} where movieId = ${movieId}`;
        const query2 = `delete from movies where id = ${movieId}`;
        const queries = [query];
        if(!isWatchlist) {
            queries.push(query2);
        }
        return await dbUtils.executeQuery(queries, true);
    },
    getYearStats: async function(year) {
        const whereClause = _.isEmpty(year) ? '' : `where year = ${year}`;
        const query = `select year, count(year)::INTEGER from movies_seen ${whereClause} group by year order by year`;
        return await dbUtils.executeQuery([query]);
    },
    getFormatStats: async function (format) {
        const whereClause = _.isEmpty(format) ? '' : `where format = '${format}'`;
        const query = `select format, s.formatCount::INTEGER as count from (
                         select formatId as id, count(formatId) as formatCount from movies_seen group by formatId) as s
                         inner join formats on formats.id = s.id ${whereClause}`;

        return await dbUtils.executeQuery([query]);
    },
    getFormatStatsByYear: async function(year) {
        const query = `select format, a.count::INTEGER as count from
                         (select formatid, count(formatId) as count from movies_seen where year = ${year} group by formatId)as a
                         inner join formats on formats.id = a.formatid`;

        return await dbUtils.executeQuery([query]);
    },
    executeQuery: async function (queries, isTransaction) {
        if (isTransaction) {
            return dbUtils._executeTransaction(queries);
        }
        try {
            let {rows: results} = await client.query(queries[0]);
            return results;
        } catch (e) {
            console.error('problem retrieving records', e);
            return { error: 'problem with database transaction'};
        }
    },
    _executeTransaction: async function (queries) {
        try {
            await client.query('BEGIN');
            let {rows: results} = await client.query(queries[0]);
            if(queries[1]) {
                await client.query(queries[1]);
            }
            await client.query('COMMIT');
            return results;
        } catch (e) {
            await client.query('ROLLBACK');
            console.error('problem executing transaction');
            return { error: 'problem executing transaction'}
        }
    }
}