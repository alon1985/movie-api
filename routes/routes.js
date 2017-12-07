var express = require('express');
var logger = require('../lib/logger.js');
var utils = require('../lib/utils.js');
var router = express.Router();

router.use(function (req, res, next) {
    if (!req.query.uid && !req.body.uid) return next('router');
    next()
});


router.get('/search', function (req, res, next) {
    utils.searchForMovies(req.query, function (result, err) {
        if (err) {
            res.status(500).json({'error': err});
            next();
        }
        res.status(200).json(result);
        next();
    });
});

router.get('/stats', function (req, res, next){
   utils.getStats(req.query.uid, function(result, err){
       if(err) {
           res.status(500).json({'error': err});
           next();
       }
       res.status(200).json(result);
       next();
   })
});
/*router.get('/export', function (req, res, next) {
    var userId = req.query.uid;
    utils.exportMovieList(userId, function (err, result) {
        if (err) {
            res.status(500).json({'error': err});
            next();
        }
        res.set('Content-Type', 'text/csv; charset=utf-8');
        res.status(200).send(new Buffer(result));
        next();
    });
});
*/
router.post('/add', function (req, res, next) {
    utils.saveMovie(req.body.title, req.body.year, req.body.format, req.body.poster, req.body.uid, function (result, err) {
        if (err) {
            res.status(500).json({'error': err});
            next();
        }
        res.status(200).json(result);
        next();
    })
});

module.exports = router;
