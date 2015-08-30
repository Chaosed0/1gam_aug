
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
var https = require('https');
var fs = require('fs');
var httpsServer = https.createServer({
    key: fs.readFileSync("/etc/ssl/myssl/straypixels_net.key"),
    cert: fs.readFileSync("/etc/ssl/myssl/straypixels_net.crt"),
}, app).listen(46467);

try {
    console.log('Old User ID: ' + process.getuid() + ', Old Group ID: ' + process.getgid());
    process.setgid('chaosed0');
    process.setuid('chaosed0');
    console.log('New User ID: ' + process.getuid() + ', New Group ID: ' + process.getgid());
} catch (err) {
    console.log('Cowardly refusing to keep the process alive as root:' + err.toString());
    process.exit(1);
}

var requirejs = require('requirejs');

requirejs.config({
    nodeRequire: require,
    paths: {
        shared: "./public/shared"
    }
});

requirejs(['./appserver/server'], function(Appserver) {
    var appserver = new Appserver(httpsServer);
});
