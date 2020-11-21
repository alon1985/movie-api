const Router = require('express-promise-router')
const processor = require('../utils/processor.js');

const router = new Router()
// export our router to be mounted by the parent application
module.exports = router

router.get('/:id', async (req, res) => {
    const results = await processor.getMovies(req.params.id);
    res.status(200).json(results);
});

router.get('/', async (req, res) => {
    const results = await processor.searchMovies(req.query);
    res.status(200).json(results);
});

router.delete('/:id', async (req, res) => {
    const results = await processor.deleteMovie(req.params.id)
})

