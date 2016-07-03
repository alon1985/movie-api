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
    MYSQL_PASSWORD: '*******',
    MYSQL_HOST: 'movie-db.alonfilm.jamotro.com'
};