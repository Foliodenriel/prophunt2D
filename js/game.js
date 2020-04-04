var config = {
    type: Phaser.AUTO,
    width: 800,
    height: 600,
    parent: 'game',
    physics: {
        default: 'arcade',
        arcade: {
            gravity: { y: 680 },
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

function preload() {

    client = new Client(); // Generating client class for socket handling
    client.addNewPlayer();

    //this.load.setBaseURL('http://127.0.0.1:3000/');

    this.load.image('player', 'assets/gobble.png');
    this.load.image('ground', 'assets/ground.png');
    this.load.spritesheet('player_sprite', 'assets/full_sprite.png', { frameWidth: 300, frameHeight: 300 });
}

function create() {

    var self = this;

//    game.world.setBounds(0, 0, 1920, 1920); Size map
//    game.camera.follow(player); Follow player


//    player = this.physics.add.image(200, 200, 'player').setScale(0.1);
    player = this.physics.add.sprite(200, 200, 'player_sprite').setScale(0.2);
    player.setBounce(0);
    player.setCollideWorldBounds(true);
    player.oldPos = {
        posX: player.x,
        posY: player.y,
    }

    this.anims.create({
        key: 'right',
        frames: this.anims.generateFrameNumbers('player_sprite', { start: 12, end: 23 }),
        frameRate: 10000,
        repeat: -1
    });

    this.anims.create({
        key: 'left',
        frames: this.anims.generateFrameNumbers('player_sprite', { start: 0, end: 11 }),
        frameRate: 10000,
        repeat: -1
    });

    platforms = this.physics.add.staticGroup();
    otherPlayers = this.physics.add.group();

    client.socket.on('currentPlayers', function(players) {

        console.log('');
        Object.keys(players).forEach(function(id) {
            if (players[id].playerId !== client.socket.id) {

                addPlayer(self, players[id]);
            }
        })
    });

    client.socket.on('newPlayer', function(player) {

        const otherPlayer = self.physics.add.image(200, 200, 'player').setScale(0.1);
        otherPlayer.playerId = player.playerId;
        otherPlayers.add(otherPlayer);
    });

    client.socket.on('newPlayerPos', function(movingPlayer) {

        otherPlayers.getChildren().forEach(function (otherPlayer) {
            if (otherPlayer.playerId === movingPlayer.playerId) {
                otherPlayer.setPosition(movingPlayer.posX, movingPlayer.posY);
            }
        });
    });

    cursors = this.input.keyboard.createCursorKeys();

    this.physics.add.collider(player, platforms);
    this.physics.add.collider(otherPlayers, platforms);

    platforms.create(200, 400, 'ground').setScale(0.1).refreshBody();
    platforms.create(230, 400, 'ground').setScale(0.1).refreshBody();
    platforms.create(260, 400, 'ground').setScale(0.1).refreshBody();
    platforms.create(290, 400, 'ground').setScale(0.1).refreshBody();
    platforms.create(320, 400, 'ground').setScale(0.1).refreshBody();

    platforms.create(380,340, 'ground').setScale(0.1).refreshBody();

    client.addNewPlayer(); // Emitting signal to server to get response signal for every socket instance
}

function update() {

    if (cursors.left.isDown) {

        player.setVelocityX(-200);

        player.anims.play('left', true);
    } else if (cursors.right.isDown) {

        player.setVelocityX(200);

        player.anims.play('right', true);
    } else if (cursors.left.isUp) {

        player.setVelocityX(0);
        player.anims.stop();
    } else if (cursors.right.isUp) {

        player.setVelocityX(0);
        player.anims.stop();
    }
    
    if (cursors.up.isDown && player.body.touching.down)
    {
        player.setVelocityY(-300);
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
            if (otherPlayer.playerId === socketId) {
                otherPlayers.remove(otherPlayer, true, true);
            }
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