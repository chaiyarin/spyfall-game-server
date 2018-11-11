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
                storePlayerInConnectionSocket[socket.id] = data.player.uniq_code;
                logger.LoggerPlayerInfo(data.player.name + ' -> Create Room');
                io.emit('sendToClientRoom:' + data.room_detail.room_code, storeRoomInConnectionSocket[data.room_detail.room_code]);
            });

            socket.on('joinRoom', function (data) {
                console.log('Join Room');
                if(storeRoomInConnectionSocket.hasOwnProperty(data.room_code)){
                    storePlayerInConnectionSocket[socket.id] = data.player.uniq_code;
                    playerTemp = storeRoomInConnectionSocket[data.room_code].players;
                    playerTemp.push(data.player);
                    storeRoomInConnectionSocket[data.room_code].players = playerTemp;
                    io.emit('sendToClientRoom:' + data.room_code, storeRoomInConnectionSocket[data.room_code]);
                }else{
                    socket.emit('noRoomCodeExist:' + data.player.uniq_code, true);
                }
            });

            socket.on('disconnect', function() {
                console.log('มีคนหลุด');
                var playerUniqCode = storePlayerInConnectionSocket[socket.id];
                for(var roomCode in storeRoomInConnectionSocket){
                    storeRoomInConnectionSocket[roomCode].players.forEach(function(player, index) {
                        if(player.uniq_code == playerUniqCode){
                            storeRoomInConnectionSocket[roomCode].players.splice(index, 1);
                            io.emit('sendToClientRoom:' + roomCode, storeRoomInConnectionSocket[roomCode]);
                        }
                    });
                }
                delete storePlayerInConnectionSocket[socket.id];
             });

          });
    }
 };