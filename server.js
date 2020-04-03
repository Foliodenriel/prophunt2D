var express = require('express');
var app = express();
var http = require('http').createServer(app);
var io = require('socket.io')(http);

var players = {};

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

    players[socket.id] = {

        posX: Math.floor(Math.random() * 700) + 50,
        posY: Math.floor(Math.random() * 500) + 50,
        playerId: socket.id,
    };

    console.log('Welcome message! player in this room: ' + Object.keys(players).length);

    socket.emit('currentPlayers', players);
    console.log('currentPlayers emitted.');
    socket.broadcast.emit('newPlayer', players[socket.id]);

    socket.on('movePlayer', function(player) {

        players[player.playerId].posX = player.posX;
        players[player.playerId].posY = player.posY;
        socket.broadcast.emit('newPlayerPos', players[player.playerId]);
    });

    // Send emit signal for current socket info to get back
    // Send broadcast signal for all other users to get info about your connection

    socket.on('disconnect', function(socket) {

        console.log('Good bye!');

        delete players[socket.id];
        io.emit('disconnect', socket.id);
    });

});