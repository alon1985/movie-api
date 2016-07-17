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

    searchForMovie: function(title, format, year, callback) {
        var foundMovies = [];
        console.log('CALL SearchForMovie("' + title + '", "' + format + '", ' + year + ')');
        pool.getConnection(function(err, connection) {
                connection.query('CALL SearchForMovie("' + title + '", "' + format + '", ' + year + ')',
                    function(err, results) {
                        if (err) {
                            connection.release();
                            return callback(err, null);
                        }
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
                        formatsSeen.push({
                            total: formatStat.total,
                            year: formatStat.yearSeen,
                            format: formatStat.movieFormat
                        });
                    });
                    stats.movieFormatsPerYear = formatsSeen;
                    callback(null, stats);
                });
        });
    }
}