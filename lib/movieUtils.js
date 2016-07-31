'use strict';

var movieUtils;
var mysql = require('mysql');
var config = require('config');
var fs = require('fs');
var _ = require('lodash');
var pool = mysql.createPool({
    database: 'movies',
    host: config.get('MYSQL_HOST'),
    user: config.get('MYSQL_USER'),
    password: config.get('MYSQL_PASSWORD'),
    ssl: {
        ca: fs.readFileSync('config/ca-cert.pem'),
        cert: fs.readFileSync('config/client-cert.pem'),
        key: fs.readFileSync('config/client-key.pem')
    },
    multipleStatements: true
});



module.exports = movieUtils = {

    formatMovieResults: function(style, results){
        var foundMovies = [];
        results[0].forEach(function(result) {
            var index = _.findIndex(foundMovies, function(o) {
                return o.title === result.title;
            });
            if (index >= 0) {
                foundMovies[index].viewed.push({year: result.yearSeen, format: result.movieFormat});
            } else {
                foundMovies.push({
                    title: result.title,
                    viewed: [{year: result.yearSeen, format: result.movieFormat}]
                });
            }
        });
        if(style !== 'default'){
            var formattedMovies = [['Movie Title', 'Movie Format', 'Year Seen']];
            foundMovies.forEach(function (result){
                var resultMovie = [result.title];
                resultMovie.push(_.map(result.viewed, 'format').join(','));
                resultMovie.push(_.map(result.viewed, 'year').join(','));
                formattedMovies.push(resultMovie);
            });
            return formattedMovies;
        }
        return foundMovies;
    },

    searchForMovie: function(title, format, year, style, callback) {
        var foundMovies = [];
        console.log('CALL SearchForMovie("' + title + '", "' + format + '", ' + year + ')');
        pool.getConnection(function(err, connection) {
            if(!connection){
                movieUtils.searchForMovie(title, format, year, callback);
            }
                connection.query('CALL SearchForMovie("' + title + '", "' + format + '", ' + year + ')',
                    function(err, results) {
                        if (err) {
                            connection.release();
                            return callback(err, null);
                        }
                        foundMovies = movieUtils.formatMovieResults(style, results);
                        connection.release();
                        callback(null, foundMovies);
                    });
            }
        );

    },
    addMovie: function(title, format, year, callback) {
        pool.getConnection(function(err, connection) {
            connection.query('CALL AddMovie("' + title + '", "' + format + '", ' + year + ')',
                function(err, results) {
                    if (err) {
                        connection.release();
                        return callback(err, null);
                    }
                    connection.release();
                    callback(null, results.affectedRows);
                }
            );
        });
    },
    getMovieStats: function(callback) {
        var stats = {};
        pool.getConnection(function(err, connection) {
            if(!connection){
                movieUtils.getMovieStats(callback);
            }
            connection.query('select distinct count(*) as total from titles; select distinct count(*) as total, yearSeen from movieSeen group by yearSeen;'
                + 'select distinct count(*) as total, yearSeen, formats.movieFormat from movieSeen inner join formats on formatId = formats.id '
                + 'group by formatId, yearSeen order by yearSeen;',
                function(err, results) {
                    if (err) {
                        connection.release();
                        return callback(err, null);
                    }
                    connection.release();
                    stats.totalMovies = results[0][0].total;
                    var yearsSeen = [];
                    results[1].forEach(function(yearStat) {
                        yearsSeen.push({total: yearStat.total, year: yearStat.yearSeen});
                    });
                    stats.moviesPerYear = yearsSeen;

                    var formatsSeen = [];
                    results[2].forEach(function(formatStat) {
                        var index = _.findIndex(formatsSeen, function(o) {
                            return o.year === formatStat.yearSeen;
                        });
                        if(index >=0){
                            formatsSeen[index].formatTotals.push({format: formatStat.movieFormat, total: formatStat.total});
                        }
                        else{

                            formatsSeen.push({
                                year: formatStat.yearSeen,
                                formatTotals: [{format: formatStat.movieFormat, total: formatStat.total}]
                            });
                        }
                    });
                    stats.movieFormatsPerYear = formatsSeen;
                    callback(null, stats);
                });
        });
    }
}