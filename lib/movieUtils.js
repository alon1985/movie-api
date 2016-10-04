'use strict';

var movieUtils;
var mysql = require('mysql');
var config = require('config');
var json2csv = require('json2csv');
var fs = require('fs');
var _ = require('lodash');
var pool = mysql.createPool({
    connectionLimit : 10,
    database: 'movies',
    host: config.get('MYSQL_HOST'),
    user: config.get('MYSQL_USER'),
    password: config.get('MYSQL_PASSWORD'),
    multipleStatements: true,
    insecureAuth: true
});



module.exports = movieUtils = {

    exportMovies: function(userId, callback){
        movieUtils.searchForMovie('', '', 0, 'blah', userId, function (err, result){
            var cellHeaders = ['Title', 'Format', 'Year'];
            var csv = json2csv({ data: result, fields: cellHeaders, del: ',' });
            callback(null, csv);
        });


    },
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
            var formattedMovies = [];
            foundMovies.forEach(function (result){
                var resultMovie = {Title: result.title, Format: _.map(result.viewed, 'format').join(','),
                Year: _.map(result.viewed, 'year').join(' || ')};
                formattedMovies.push(resultMovie);
            });
            return formattedMovies;
        }
        return foundMovies;
    },

    searchForMovie: function(title, format, year, style, userId, callback) {
        var foundMovies = [];
        console.log('CALL SearchForMovie("' + title + '", "' + format + '", ' + year + ', "' + userId + '")');
        pool.getConnection(function(err, connection) {
            if(err){
                callback(err, null);
            }
                connection.query('CALL SearchForMovie("' + title + '", "' + format + '", ' + year + ', "' + userId + '")',
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
    addMovie: function(title, format, year, userId, callback) {
        pool.getConnection(function(err, connection) {
            connection.query('CALL AddMovie("' + title + '", "' + format + '", ' + year + ', "' + userId + '")',
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
    getMovieStats: function(userId, callback) {
        var stats = {};
        pool.getConnection(function(err, connection) {
            if(err){
                callback(err, null);
            }
            connection.query('SELECT COUNT(DISTINCT movieId) AS movieCount FROM movieSeen where userId = "' + userId + '"; select distinct count(*) as total, yearSeen from movieSeen where userId = "' + userId + '" group by yearSeen;'
                + 'select distinct count(*) as total, yearSeen, formats.movieFormat from movieSeen inner join formats on formatId = formats.id '
                + 'where userId = "' + userId + '" group by formatId, yearSeen order by yearSeen;',
                function(err, results) {
                    if (err) {
                        connection.release();
                        return callback(err, null);
                    }
                    connection.release();
                    stats.totalMovies = results[0][0].movieCount;
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