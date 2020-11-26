'use strict';
const _ = require('lodash');
let requestUtils;

module.exports = requestUtils = {
    isRequestValid: function (body) {
        return !(_.isEmpty(body.title) || _.isEmpty(body.format) || _.isEmpty(body.plot) || _.isEmpty(body.poster) || !body.year);
    },
    isWatchlistRequestValid: function (body) {
        return !(_.isEmpty(body.title) || _.isEmpty(body.releaseDate) || _.isEmpty(body.plot) || _.isEmpty(body.poster));
    }
}