'use strict';

var movieUtils;
var mysql = require('mysql');
var config = require('config');
var fs = require('fs');

module.exports = movieUtils = {

    getConnection: function() {
        return mysql.createConnection({
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
    },
    getMovieById: function(id, callback) {
        var foundMovie = {
            title: '',
            seen: []
        };
        var connection = movieUtils.getConnection();
        connection.query(
            'CALL  GetMovieById(' + id + ')',
            function(err, results) {
                if (err) {
                    callback(err, null);
                }
                results[0].forEach(function(result) {
                    foundMovie.title = result.title;
                    foundMovie.seen.push({year: result.yearSeen, format: result.movieFormat});

                });
                callback(null, foundMovie);
            }
        );
        connection.end();
    },
    movieSearch: function(title, format, year, callback) {
        var connection = movieUtils.getConnection();
        connection.query(
            'SELECT * FROM `titles` LIMIT 10 ',
            function(err, results) {
                if (err) {
                    callback(err, null);
                }
                callback(null, results.map(function(result) {
                    return result.title;
                }));
            }
        );
        connection.end();
    },
    addMovie: function(title, format, year, callback) {
        var connection = movieUtils.getConnection();
        connection.query(
            'SELECT * FROM `titles` LIMIT 10 ',
            function(err, results) {
                if (err) {
                    callback(err, null);
                }
                callback(null, results.map(function(result) {
                    return result.title;
                }));
            }
        );
        connection.end();
    }
};