class Client {

    socket;

    constructor() {

        this.socket = io();
    }

    addNewPlayer() {

        this.socket.emit('addnewplayer');
    }
}