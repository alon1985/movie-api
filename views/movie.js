'use strict';

module.exports = (function (){
    var logger = require('../lib/logger.js');
    var restify = require('restify');
    var movieUtils = require('../lib/movieUtils.js');

    return {
        '/movies/search': {
            'get': function movieSearch(req, res, next){
                var title = req.params.title || '';
                var year = req.params.year || '0';
                var formatSeen = req.params.formatSeen || '';
                movieUtils.searchForMovie(title, formatSeen, parseInt(year), function (err, results){
                    if(err){
                        logger.error('movie get');
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
                        logger.error('movie get');
                        res.send(500, {error: err});
                    }else {
                        res.send(200, results);
                    }
                    return next();
                });
            }
        }
    };
})();