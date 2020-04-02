var config = {
    type: Phaser.AUTO,
    width: 800,
    height: 600,
    parent: 'game',
    scene: {
        preload: preload,
        create: create,
        update: update
    }
};

var game = new Phaser.Game(config);

function preload() {

    this.client = new Client(); // Generating client class for socket handling
}

function create() {

    this.client.addNewPlayer(); // Emitting signal to server to get response signal for every socket instance
}

function update() {

}