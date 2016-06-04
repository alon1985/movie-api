
'use strict';

var fs = require('fs');
var restify = require('restify');
var logger = require('./lib/logger.js')
var swaggerJson = require('./swagger/swagger.json');
var express = require('express');
var path = require('path');
var staticDocServer = express.static(path.dirname(require.resolve('swagger-ui')));
var url = require('url');

// only reason to bind routes like this instead of actually binding is so that the views can be tested
// without having to mock out the api
function bindRoutes(handlers, api) {
    Object.keys(handlers).forEach(function bindRoute(path) {
        logger.info('Binding path:' + path);
        var routes = handlers[path];
        Object.keys(routes).forEach(function bindRouteMethod(method) {
            api[method](path, routes[method]);
        });
    });
}


function createServer(logger) {
    var server = restify.createServer({});
    server.use(restify.acceptParser(server.acceptable));
    server.use(restify.queryParser());
    server.use(restify.bodyParser());
    server.use(restify.requestLogger());


    server.on('uncaughtException', function(req, res, route, error) {
        return res.send(500, error);
    });

    process.on('uncaughtException', function(err) {
        logger.error(err);
    });

    server.get('/api-docs', function (req, res, next){
        res.send(swaggerJson);
        next();
    });

    server.get(/^\/help(\/.*)?$/, function (req, res, next){
        var redirUrl = null;
        if (req.url === '/help' || !req.params.url) { // express static wants a trailing slash
            if (req.url === '/help') {
                req.url += '/';
            }
            if (!req.params.url) {
                var startUrl = url.parse(req.url, true);
                startUrl.query.url = '/api-docs';
                redirUrl = url.format(startUrl);
            }
            res.redirect(302, (redirUrl || req.url), next);
        }
        req.url = req.url.substr('/help'.length); // fix pathing
        return staticDocServer(req, res, next);
    });

    fs.readdirSync('./views').forEach(function loadView(viewFile) {
        logger.info('Loading route: ' + viewFile);
        bindRoutes(require('./views/' + viewFile), server);
    });

    return server;
}

var server = createServer(logger);
server.listen(3000);