'use strict';

module.exports = (function (){
    var restify = require('restify');
    var movieUtils = require('../lib/movieUtils.js');
    var config = require('config');

    return {
        '/movies/search': {
            'get': function movieSearch(req, res, next){
                var title = req.params.title || '';
                var year = req.params.year || '0';
                var formatSeen = req.params.formatSeen || '';
                movieUtils.searchForMovie(title, formatSeen, parseInt(year), function (err, results){
                    if(err){
                        res.send(500, {error: err});
                    } else {
                        res.send(200, results);
                    }
                    return next();
                });
            }
        },
        '/movies/:movieId': {
            'get': function getMovie(req, res, next) {
                if (!req.params.movieId) {
                    return next(new restify.InvalidArgumentError('movie id required'));
                }
                movieUtils.getMovieById(parseInt(req.params.movieId), function (err, results){
                    if(err){
                        res.send(500, {error: err});
                    }else {
                        res.send(200, results);
                    }
                    return next();
                });
            }
        },
        '/movies/add': {
            'post': function getMovie(req, res, next) {
                var title = req.params.title || '';
                var year = req.params.year || '0';
                var formatSeen = req.params.format || '';
                var consumer = req.params.consumer;
                if(consumer!==config.MYSQL_PASSWORD){
                    res.send(500, {error: 'Bad Password'});
                }
                else {
                    movieUtils.addMovie(title, formatSeen, parseInt(year), function(err, results) {
                        if (err) {
                            res.send(500, {error: err});
                        } else {
                            if (results == 1) {
                                var success = {
                                    status: 'Success',
                                    message: title + ' added to List'
                                };
                            }
                            res.send(200, success);
                        }
                        return next();
                    });
                }
            }
        },
        '/movies/stats': {
            'get': function getMovieStats(req, res, next) {
                movieUtils.getMovieStats(function (err, results){
                   if(err){
                       res.send(500, {error: err});
                   }
                    else{
                       res.send(200, results);
                   }
                    return next();
                });
            }
        }
    };
})();