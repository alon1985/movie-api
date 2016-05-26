'use strict';

var movieUtils;
var mysql = require('mysql');
var config = require('config');
var extend = require('lodash').assign;

module.exports = movieUtils = {
    getConnection: function () {
        return mysql.createConnection(extend({
            database: 'movies'
        }, {
            host: config.get('MYSQL_HOST'),
            user: config.get('MYSQL_USER'),
            password: config.get('MYSQL_PASSWORD')
        }));
    },
    getMovieById: function(id, callback) {
        var connection = movieUtils.getConnection();
        connection.query(
            'SELECT * FROM `titles` LIMIT 10 ',
            function(err, results) {
                if (err) {
                    callback(err, null);
                }
                callback(null, results.map(function (result){
                    return result.title;
                }));
            }
        );
        connection.end();
    }
};