var config = {
    type: Phaser.AUTO,
    width: 704,
    height: 704,
    parent: 'game',
    backgroundColor: '#93FFFF',
    physics: {
        default: 'arcade',
        arcade: {
            gravity: { y: 1500 },
            debug: false
        }
    },
    scene: {
        preload: preload,
        create: create,
        update: update
    }
};

var game = new Phaser.Game(config);

var platforms;
var player;
var otherPlayers;
var cursors;
var client;
var jumpCount = 0;
var goingLeft = false;
var goingRight = false;
var airSpeed = 250;

function preload() {

    client = new Client(); // Generating client class for socket handling
    client.addNewPlayer();

    //this.load.setBaseURL('http://127.0.0.1:3000/');

    this.load.image('tiles', 'assets/tiles.png');
    this.load.tilemapCSV('map', 'assets/map.csv');
    this.load.image('player', 'assets/gobble.png');
}

function create() {

    var self = this;

    // When loading from an array, make sure to specify the tileWidth and tileHeight
    const map = this.make.tilemap({ key: 'map', tileWidth: 64, tileHeight: 64 });
    const tiles = map.addTilesetImage('tiles');
    const layer = map.createStaticLayer(0, tiles, 0, 0);
    layer.setCollisionBetween(0, 5);

    player = this.physics.add.image(100, 400, 'player').setScale(0.1);
    player.setBounce(0);
    player.setCollideWorldBounds(true);
    player.oldPos = {
        posX: player.x,
        posY: player.y,
    }

    this.physics.add.collider(player, layer);

    otherPlayers = this.physics.add.group();

    client.socket.on('currentPlayers', function(players) {

        Object.keys(players).forEach(function(id) {
            if (players[id].playerId !== client.socket.id)
                addPlayer(self, players[id]);
        })
    });

    client.socket.on('newPlayer', function(player) {

        const otherPlayer = self.physics.add.image(100, 400, 'player').setScale(0.1);
        otherPlayer.playerId = player.playerId;
        otherPlayers.add(otherPlayer);
    });

    client.socket.on('newPlayerPos', function(movingPlayer) {

        otherPlayers.getChildren().forEach(function (otherPlayer) {
            if (otherPlayer.playerId === movingPlayer.playerId)
                otherPlayer.setPosition(movingPlayer.posX, movingPlayer.posY);
        });
    });

    cursors = this.input.keyboard.createCursorKeys();

    client.addNewPlayer(); // Emitting signal to server to get response signal for every socket instance
}

function update() {

    let onFloor = player.body.blocked.down;
    let upJustDown = Phaser.Input.Keyboard.JustDown(cursors.up);

    // Move player left and right
    if (cursors.left.isDown) {
        goingLeft = true;
        goingRight = false;
        player.setVelocityX(-250);
    } else if (cursors.right.isDown) {
        goingRight = true;
        goingLeft = false;
        player.setVelocityX(250);
    } else if (cursors.left.isUp)
        player.setVelocityX(0);
    else if (cursors.right.isUp)
        player.setVelocityX(0);

    // Player speed deceleration if user release left/right arrow key
    if (!onFloor) {
        if (airSpeed > 0)
            airSpeed -= 3;
        if (cursors.left.isUp && cursors.right.isUp && goingLeft)
            player.setVelocityX(-airSpeed);
        else if (cursors.right.isUp && cursors.left.isUp && goingRight)
            player.setVelocityX(airSpeed);
    }
    
    // If player touch the floor, reset values
    if (onFloor) {
        jumpCount = 0;
        airSpeed = 250;
        goingLeft = false;
        goingRight = false;
    }

    // Double jump
    if (upJustDown && jumpCount === 0) {
        player.setVelocityY(-500);
        jumpCount = 1;
    } else if (upJustDown && !onFloor && jumpCount === 1) {
        player.setVelocityY(-500);
        jumpCount = 2;
    }

    if (player.oldPos.posX !== player.x || player.oldPos.posY !== player.y) {

        var newPlayerObjectPos = {
            posX: player.x,
            posY: player.y,
            playerId: client.socket.id
        }
        client.socket.emit('movePlayer', newPlayerObjectPos);
    }

    client.socket.on('disconnect', function(socketId) {

        otherPlayers.getChildren().forEach(function (otherPlayer) {
            if (otherPlayer.playerId === socketId)
                otherPlayers.remove(otherPlayer, true, true);
        });
    });

    player.oldPos = {
        posX: player.x,
        posY: player.y,
    }
}

function addPlayer(self, player) {

    const otherPlayer = self.physics.add.image(player.posX, player.posY, 'player').setScale(0.1);
    otherPlayer.playerId = player.playerId;
    otherPlayers.add(otherPlayer);
}