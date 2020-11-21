const Router = require('express-promise-router')
const processor = require('../utils/processor.js');

const router = new Router()
module.exports = router

router.get('/years', async (req, res) => {
    const results = await processor.getYearStats(req.params.year);
    res.status(200).json(results);
});


router.get('/years/:year', async (req, res) => {
    const results = await processor.getYearStats(req.params.year);
    res.status(200).json(results);
});

router.get('/formats', async (req, res) => {
    const results = await processor.getFormatStats(req.params.format);
    res.status(200).json(results);
});

router.get('/formats/:format', async (req, res) => {
    const results = await processor.getFormatStats(req.params.format);
    res.status(200).json(results);
});

router.get('/', async (req, res) => {
    const results = await processor.getStats();
    res.status(200).json(results);
});

