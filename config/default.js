'use strict';
module.exports = {
    logger: {
        name: 'movie-api',
        streams: [
            {
                level: 'debug',
                stream: 'stdout'
            }
        ]
    },
    GCLOUD_PROJECT: 'alon-film-id',
    DATA_BACKEND: 'cloudsql',
    MYSQL_USER: 'movie-api-user',
    MYSQL_PASSWORD: 'kidon85',
    MYSQL_HOST: '45.55.159.100'
};