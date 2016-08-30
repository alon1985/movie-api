'use strict';

module.exports = (function (){
    var restify = require('restify');
    var movieUtils = require('../lib/movieUtils.js');
    var config = require('config');

    return {
        '/movies/upload': {
          'get': function uploadMovieList(req, res, next){
              var authToken = req.params.key;
              movieUtils.uploadMovies(authToken, function (err, results){
                 if(err){
                     res.send(500, {error: err});
                 } else {
                     res.send(200, {status: 'success'});
                 }
                 return next();
              });
          }
        },
        '/movies/search': {
            'get': function movieSearch(req, res, next){
                var title = req.params.title || '';
                var year = req.params.year || '0';
                var style = req.params.style || 'default';
                var formatSeen = req.params.formatSeen || '';
                var userId = req.params.uid;
                movieUtils.searchForMovie(title, formatSeen, parseInt(year), style, userId, function (err, results){
                    if(err){
                        res.send(500, {error: err});
                    } else {
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
                var userId = req.params.uid;
                var consumer = req.params.consumer;
                if(consumer!==config.MYSQL_PASSWORD){
                    res.send(500, {error: 'Bad Password'});
                }
                else {
                    movieUtils.addMovie(title, formatSeen, parseInt(year), userId, function(err, results) {
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
            'get': function getStats(req, res, next) {
                var userId = req.params.uid;
                movieUtils.getMovieStats(userId, function (err, results){
                   if(err){
                       res.send(500, {error: 'HERE' + err});
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