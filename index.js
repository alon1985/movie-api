
'use strict';
//require('@google/cloud-debug');
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
    server.use( restify.CORS() );

// Lets try and fix CORS support
// By default the restify middleware doesn't do much unless you instruct
// it to allow the correct headers.
//
// See issues:
// https://github.com/mcavage/node-restify/issues/284 (closed)
// https://github.com/mcavage/node-restify/issues/664 (unresolved)
//
// What it boils down to is that each client framework uses different headers
// and you have to enable the ones by hand that you may need.
// The authorization one is key for our authentication strategy
//
    restify.CORS.ALLOW_HEADERS.push( "x-requested-with"     );
    restify.CORS.ALLOW_HEADERS.push( "x-forwarded-for"      );
    restify.CORS.ALLOW_HEADERS.push( "x-real-ip"            );
    restify.CORS.ALLOW_HEADERS.push( "x-customheader"       );
    restify.CORS.ALLOW_HEADERS.push( "user-agent"           );
    restify.CORS.ALLOW_HEADERS.push( "keep-alive"           );
    restify.CORS.ALLOW_HEADERS.push( "host"                 );
    restify.CORS.ALLOW_HEADERS.push( "accept"               );
    restify.CORS.ALLOW_HEADERS.push( "connection"           );
    restify.CORS.ALLOW_HEADERS.push( "content-type"         );
    restify.CORS.ALLOW_HEADERS.push( "dnt"                  ); // Do not track
    restify.CORS.ALLOW_HEADERS.push( "if-modified-since"    );
    restify.CORS.ALLOW_HEADERS.push( "cache-control"        );

// Manually implement the method not allowed handler to fix failing preflights
//
    server.on( "MethodNotAllowed", function( request, response )
    {
        if ( request.method.toUpperCase() === "OPTIONS" )
        {
            // Send the CORS headers
            //
            response.header( "Access-Control-Allow-Credentials", true                                    );
            response.header( "Access-Control-Allow-Headers",     restify.CORS.ALLOW_HEADERS.join( ", " ) );
            response.header( "Access-Control-Allow-Methods",     "GET, POST, PUT, DELETE, OPTIONS"       );
            response.header( "Access-Control-Allow-Origin",      request.headers.origin                  );
            response.header( "Access-Control-Max-Age",           0                                       );
            response.header( "Content-type",                     "text/plain charset=UTF-8"              );
            response.header( "Content-length",                   0                                       );

            response.send( 204 );
        }
        else
        {
            response.send( new restify.MethodNotAllowedError() );
        }
    } );

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


    server.use(function requireUserParam(req, res, next) {
        if (req.url.indexOf('help') > -1 || req.url.indexOf('api-docs') > -1)  return next(); /* don't require consumer params for swagger!*/
        if (!req.params.uid) return next(new restify.InvalidArgumentError('UserId not passed in'));
        return next();
    });


    fs.readdirSync('./views').forEach(function loadView(viewFile) {
        logger.info('Loading route: ' + viewFile);
        bindRoutes(require('./views/' + viewFile), server);
    });

    return server;
}

var server = createServer(logger);
server.listen(process.env.PORT || 8080);