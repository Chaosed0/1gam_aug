
/* --- Webserver --- */
var express = require('express');
var http = require('http');

var app = express();
var httpServer = http.Server(app);

app.use(express.static(__dirname+'/public/'));

app.get('/', function(req, res){
        res.sendfile(__dirname + '/index.html');
});

app.listen(8000);

/* --- App server --- */
var requirejs = require('requirejs');

requirejs.config({
    nodeRequire: require,
    paths: {
        shared: "./public/shared"
    }
});

requirejs(['./appserver/server']);
