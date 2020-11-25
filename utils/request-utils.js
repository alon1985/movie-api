'use strict';
const _ = require('lodash');
let requestUtils;

module.exports = requestUtils = {
    isRequestValid: function (body) {
        if(_.isEmpty(body.title) || _.isEmpty(body.format) || _.isEmpty(body.plot) || _.isEmpty(body.poster) || !body.year) {
            return false;
        }
        return true;
    }
}