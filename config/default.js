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
    MYSQL_USER: 'root',
    MYSQL_PASSWORD: '******',
    MYSQL_HOST: '104.196.147.188'
};