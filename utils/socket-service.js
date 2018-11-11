var logger = require('./logs-service');
var storePlayerInConnectionSocket = {};
var storeRoomInConnectionSocket = new Array();
var roomDetailTemp = {};
var playerTemp = new Array();

module.exports = {
    spyfallSocketService:function(io){
        io.on('connection', function (socket) {
            const _id = socket.id;
            var key = socket.handshake.query.room_code;

            socket.on('createRoom', function (data) { // roomDetail , Player
                roomDetailTemp = data.room_detail;
                playerTemp.push(data.player);
                roomDetailTemp.players = playerTemp;
                storeRoomInConnectionSocket[data.room_detail.room_code] = roomDetailTemp;
                logger.LoggerPlayerInfo(data.player.name + ' -> Create Room');
                socket.emit('sendToClientRoom:' + data.room_detail.room_code, storeRoomInConnectionSocket[data.room_detail.room_code]);
            });

            socket.on('joinRoom', function (data) {
                if(storeRoomInConnectionSocket.hasOwnProperty(data.room_code)){
                    console.log('Join Room');
                    // sendRoomDetailToClient(socket);
                }else{
                    console.log('Not Have')
                }
            });

            socket.on('startGame', function (room_code) {

            });

            socket.on('endGame', function () {

            });

          });
    }
 };