var express = require('express');
var app = express();
var http = require('http').createServer(app);
var io = require('socket.io')(http);

app.use('/css',express.static(__dirname + '/css'));
app.use('/js',express.static(__dirname + '/js'));
app.use('/assets',express.static(__dirname + '/assets'));

app.get('/', function(req, res) {
    res.sendFile(__dirname + '/index.html');
});

http.listen(3000, function() {

    console.log('listening on *:3000');
});

io.on('connection', function(socket) {

    console.log('Welcome message!');

    socket.on('addnewplayer', function() {

        // Do things you do when adding new player such as filling socket
    });

    // Send emit signal for current socket info to get back
    // Send broadcast signal for all other users to get info about your connection

    socket.on('disconnect', function() {

        console.log('Good bye!');
    });

});