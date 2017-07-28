'use strict';
module.exports = {
    couchbase: {
        buckets: {
            'movies': {
                name: 'movies',
                password: 'al3185on1'
            }
        }
    },
    searchQuery: 'SELECT movieList \n' +
    'FROM movies b \n' +
    'UNNEST b.movieList \n' +
    'WHERE lower(movieList.%s) like lower(%s)'
};