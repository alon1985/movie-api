'use strict';

const Router = require('express-promise-router');
const router = new Router();
module.exports = router;


router.get('/',  async (req, res) => {
    return res.status(200).json({status: 'ok'});
});
