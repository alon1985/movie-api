var express = require('express');
var logger = require('../lib/logger.js');
var movieUtils = require('../lib/movie-utils.js');
var router = express.Router();

router.use(function (req, res, next) {
    if (!req.query.uid && !req.body.uid) return next('router');
    next()
});

router.get('/movies', function (req, res, next) {
    movieUtils.getMovies(req.query.uid).then(function (result) {
        res.status(200).json(result);
        next();
    }).catch(function (error) {
        res.status(500).json({'error': error});
        next();
    });
});

router.get('/movies/watchlist', function (req, res, next) {
    movieUtils.getWatchlist(req.query.uid).then(function (result) {
        res.status(200).json(result);
        next();
    }).catch(function (error) {
        res.status(500).json({'error': error});
        next();
    });
});

router.get('/movies/search', function (req, res, next) {
    movieUtils.searchForMovies(req.query).then(function (result) {
        res.status(200).json(result);
        next();
    }).catch(function (error) {
        res.status(500).json({'error': error});
        next();
    });
});

router.get('/movies/stats', function (req, res, next) {
    movieUtils.getStats(req.query.uid).then(function (result) {
        res.status(200).json(result);
        next();
    }).catch(function (error) {
        res.status(500).json({'error': error});
        next();
    });
});
router.get('/movies/export', function (req, res, next) {
    var userId = req.query.uid;
    movieUtils.exportMovieList(userId, function (result, err) {
        if (err) {
            res.status(500).json({'error': err});
            return next();
        }
        res.set('Content-Type', 'text/csv; charset=utf-8');
        res.setHeader('Content-disposition', 'attachment; filename=movies.csv');
        res.set('Content-Type', 'text/csv');
        res.status(200).send(result);
        next();
    });
});

router.post('/movies/add', function (req, res, next) {
    movieUtils.saveMovie(req.body.title, req.body.year, req.body.format, req.body.poster, req.body.uid).then(function (result) {
        movieUtils.updateStats("add", req.body.format, req.body.year, req.body.uid).then(function (result) {
            res.status(200).json(result);
            next();
        }).catch(function (error) {
            res.status(500).json({'error': error});
            next();
        });
    });
});

router.post('/movies/remove', function (req, res, next) {
    movieUtils.removeMovie(req.body.title, req.body.poster, req.body.uid).then(function (result) {
        res.status(200).json(result);
        next();
    }).catch(function (error) {
        res.status(500).json({'error': error});
        next();
    });
});

router.post('/movies/watchlist/add', function (req, res, next) {
    movieUtils.saveMovieToWatchlist(req.body.title, req.body.releaseDate, req.body.poster, req.body.uid).then(function (result) {
        res.status(200).json(result);
        next();
    }).catch(function (error) {
        res.status(500).json({'error': error});
        next();
    });
});

router.post('/movies/watchlist/remove', function (req, res, next) {
    movieUtils.removeMovieFromWatchlist(req.body.title, req.body.uid).then(function (result) {
        res.status(200).json(result);
        next();
    }).catch(function (error) {
        res.status(500).json({'error': error});
        next();
    });
});

module.exports = router;
