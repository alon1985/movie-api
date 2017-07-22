// routes/calendarRouter.js

var express = require('express');
var logger = require('../lib/logger.js');
var config = require('config');
var json2csv = require('json2csv');
var couchbaseClient = require('../lib/couchbase/client.js');
var router = express.Router();

router.use(function (req, res, next) {
    if (!req.query.uid) return next('router');
    next()
})


router.get('/search', function (req, res, next) {
    var movieBucket = couchbaseClient.getBucket(config.couchbase.buckets['movies'].name);
    var userId = req.query.uid;
    movieBucket.get('uid_' + userId + '_list', function (err, result) {
        if (err) {
            res.status(500).json({'error': err});
        }
        movieList = result.value['movie_list'];
        res.status(200).json(movieList);
        next();
    });
});

router.get('/export', function (req, res, next) {
    var userId = req.query.uid;
    movieBucket.get('uid_' + userId + '_list', function (err, result) {
        if (err) {
            res.status(500).json({'error': err});
        }
        movieList = result.value['movie_list'];
        var cellHeaders = ['Title', 'Format', 'Year'];
        var csv = json2csv({data: result, fields: cellHeaders, del: ','});
        res.set('Content-Type', 'text/csv; charset=utf-8');
        res.status(200).send(new Buffer(csv));
        next();
    });

});

module.exports = router;
