'use strict';

const Router = require('express-promise-router');
const processor = require('../lib/processor.js');
const requestUtils = require('../utils/request-utils.js');
const router = new Router();

module.exports = router;

router.get('/movies/:id', async (req, res) => {
    const results = await processor.getMovie(req.params.id);
    return res.status(200).json(results);
});


router.get('/movies', async (req, res) => {
    const results = await processor.getMovies(req.query);
    return res.status(200).json(results);
});

router.get('/watchlist', async (req, res) => {
    const results = await processor.getWatchlistMovies();
    return res.status(200).json(results);
})

router.get('/watchlist/:id', async (req, res) => {
    const results = await processor.getWatchlistMovie(req.params.id);
    return res.status(200).json(results);
})

router.delete('/movies/:id', async (req, res) => {
    const results = await processor.deleteMovie(req.params.id, false);
    return res.status(200).json(results);
});

router.delete('/watchlist/:id', async (req, res) => {
    const results = await processor.deleteMovie(req.params.id, true);
    return res.status(200).json(results);
})

router.post('/movies/add', async (req, res) => {
    if(requestUtils.isRequestValid(req.body)) {
        const results = await processor.saveMovieSeen(req.body.id, req.body.title, req.body.year, req.body.format, req.body.poster, req.body.plot);
        return res.status(200).json(results);
    }
    return res.status(400).json({ 'status': 'Bad request - missing body fields'});
});

router.post('/watchlist/add', async (req, res) => {
    if(requestUtils.isWatchlistRequestValid(req.body)) {
        const results = await processor.saveMovieToWatchlist(req.body.title, req.body.releaseDate, req.body.poster, req.body.plot);
        res.status(200).json(results);
    }
    return res.status(400).json({ 'status': 'Bad request - missing body fields'});
});

router.get('/export', async (req, res) => {
   const results = await processor.exportMovies({});
    res.set('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-disposition', 'attachment; filename=movies.csv');
    res.set('Content-Type', 'text/csv');
    return res.status(200).send(results);
});

