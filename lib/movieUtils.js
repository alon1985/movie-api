'use strict';

var movieUtils;
var mysql = require('mysql');
var config = require('config');
var fs = require('fs');
var _ = require('lodash');
var pool  = mysql.createPool({
    connectionLimit : 10,
    database: 'movies',
    host: config.get('MYSQL_HOST'),
    user: config.get('MYSQL_USER'),
    password: config.get('MYSQL_PASSWORD'),
    ssl: {
        ca: fs.readFileSync('config/ca-cert.pem'),
        cert: fs.readFileSync('config/client-cert.pem'),
        key: fs.readFileSync('config/client-key.pem')
    }
});

module.exports = movieUtils = {


    getMovieById: function(id, callback) {
        var foundMovie = { };
        pool.getConnection(function (err, connection) {
            connection.query(
                'CALL  GetMovieById(' + id + ')',
                function(err, results) {
                    if (err) {
                        connection.release();
                        return callback(err, null);
                    }
                    results[0].forEach(function(result) {
                        foundMovie[0].title = result.title;
                        foundMovie[0].viewed.push({year: result.yearSeen, format: result.movieFormat});
                    });
                    connection.release();
                    callback(null, foundMovie);
                }
            );
        });
    },
    searchForMovie: function(title, format, year, callback) {
        var foundMovies = [];
        console.log('CALL SearchForMovie("' + title + '", "' + format + '", ' + year + ')');
        pool.getConnection(function (err, connection) {
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
        pool.getConnection(function (err, connection) {
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
    getMovieStats: function(callback){
        //get number of movies per year, format, per year/format
    }
};