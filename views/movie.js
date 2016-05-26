'use strict';

module.exports = (function (){
    var logger = require('../lib/logger.js');
    var restify = require('restify');
    var movieUtils = require('../lib/movieUtils.js');

    return {
        '/movies/:movieId': {
            'get': function getMovie(req, res, next) {
                if (!req.params.movieId) {
                    return next(new restify.InvalidArgumentError('movie id required'));
                }
                movieUtils.getMovieById(1, function (err, results){
                    if(err){
                        logger.error('movie get');
                        res.send(500, {error: 'movie get'});
                    }
                    res.send(200, results);
                });
                return next();
            }
        },
        '/movies/search/': {
            'get': function movieSearch(req, res, next){
                if (!req.params.movieId) {
                    return next(new restify.InvalidArgumentError('movie id required'));
                }
                logger.error('movie get');
                res.send(500, {error: 'movie get'});
                return next();
            }
        }
    };
})();