const Router = require('express-promise-router')
const processor = require('../utils/processor.js');

const router = new Router();
module.exports = router;

router.get('/:id', async (req, res) => {
    const results = await processor.getMovie(req.params.id);
    res.status(200).json(results);
});


router.get('/', async (req, res) => {
    const results = await processor.getMovies(req.query);
    res.status(200).json(results);
});

router.get('/watchlist', async (req, res) => {
    const results = await processor.getWatchlistMovies();
    res.status(200).json(results);
})

router.delete('/:id', async (req, res) => {
    const results = await processor.deleteMovie(req.params.id, false)
});

router.delete('/watchlist/:id', async (req, res) => {
    const results = await processor.deleteMovie(req.params.id, true)
})

router.post('/add', async (req, res) => {
    const results = await processor.saveMovieSeen(req.params.title, req.params.year, req.params.format, req.params.poster, req.params.plot);
});

router.post('/add/watchlist', async (req, res) => {
    const results = await processor.saveMovieToWatchlist(req.params.title, req.params.releaseDate, req.params.poster, req.params.plot);

});

router.get('/export', async (req, res) => {
   const results = await processor.exportMovies();
    res.set('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-disposition', 'attachment; filename=movies.csv');
    res.set('Content-Type', 'text/csv');
    res.status(200).send(results);
});

