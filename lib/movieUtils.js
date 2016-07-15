'use strict';

var movieUtils;
var mysql = require('mysql');
var config = require('config');
var fs = require('fs');
var _ = require('lodash');

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
        var foundMovie = { };
        var connection = movieUtils.getConnection();
        connection.query(
            'CALL  GetMovieById(' + id + ')',
            function(err, results) {
                if (err) {
                    return callback(err, null);
                }
                results[0].forEach(function(result) {
                        foundMovie[0].title = result.title;
                        foundMovie[0].viewed.push({year: result.yearSeen, format: result.movieFormat});
                });
                callback(null, foundMovie);
            }
        );
        connection.end();
    },
    searchForMovie: function(title, format, year, callback) {
        var connection = movieUtils.getConnection();
        var foundMovies = [];
        console.log('CALL SearchForMovie("' + title + '", "' + format + '", ' + year + ')');
        connection.query('CALL SearchForMovie("' + title + '", "' + format + '", ' + year + ')',
            function(err, results) {
                if (err) {
                    return callback(err, null);
                }
                results[0].forEach(function(result) {
                    var index = _.findIndex(foundMovies, function(o) { return o.title === result.title; });
                    if (index>=0){
                        foundMovies[index].viewed.push({year: result.yearSeen, format: result.movieFormat});
                    } else {
                        foundMovies.push({title: result.title, viewed: [{year: result.yearSeen, format: result.movieFormat}]});
                    }
                });
                callback(null, foundMovies);
            }
        );
        connection.end();
    },
    addMovie: function(title, format, year, callback) {
        var connection = movieUtils.getConnection();
        connection.query('CALL AddMovie("' + title + '", "' + format + '", ' + year + ')',
            function(err, results) {
                if (err) {
                    return callback(err, null);
                }
                callback(null, results.affectedRows);
            }
        );
        connection.end();
    },
    getMovieStats: function(callback){
        //get number of movies per year, format, per year/format
    }
};