'use strict';

const Router = require('express-promise-router');
const router = new Router();
module.exports = router;

router.get('/service-status',  (req, res) => {
    res.status(200).json({status: 'ok'});
});