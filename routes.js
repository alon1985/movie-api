const express = require('express');
const router = express.Router();

/*
router.use(function (req, res, next) {
    console.log('%s %s %s', req.method, req.url, req.path);
    next();
})*/

router.get('/service-status', (req, res) => {
    res.status(200).json({status: 'ok'});
})

module.exports = router;

