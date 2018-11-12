var logger = require('./logs-service');
var storePlayerInConnectionSocket = {};
var storeRoomInConnectionSocket = new Array();
var roomDetailTemp = {};
var playerTemp = new Array();

module.exports = {
    spyfallSocketService: function(io){
        io.on('connection', function (socket) {
            const _id = socket.id;
            var key = socket.handshake.query.room_code;

            socket.on('createRoom', function (data) { // roomDetail , Player
                playerTemp = new Array();
                roomDetailTemp = data.room_detail;
                playerTemp.push(data.player);
                roomDetailTemp.players = playerTemp;
                storeRoomInConnectionSocket[data.room_detail.room_code] = roomDetailTemp;
                storePlayerInConnectionSocket[socket.id] = data.player.uniq_code;
                logger.LoggerPlayerInfo(data.player.name + ' -> Create Room');
                io.emit('sendToClientRoom:' + data.room_detail.room_code, storeRoomInConnectionSocket[data.room_detail.room_code]);
            });

            socket.on('joinRoom', function (data) {
                if(storeRoomInConnectionSocket.hasOwnProperty(data.room_code)){
                    playerTemp = new Array();
                    storePlayerInConnectionSocket[socket.id] = data.player.uniq_code;
                    playerTemp = storeRoomInConnectionSocket[data.room_code].players;
                    playerTemp.push(data.player);
                    storeRoomInConnectionSocket[data.room_code].players = playerTemp;
                    io.emit('sendToClientRoom:' + data.room_code, storeRoomInConnectionSocket[data.room_code]);
                }else{
                    socket.emit('noRoomCodeExist:' + data.player.uniq_code, true);
                }
            });

            socket.on('kickUser', function (data) {
                try {
                    storeRoomInConnectionSocket[data.room_code].players.forEach(function(player, index) {
                        if(player.uniq_code == data.player.uniq_code){
                            storeRoomInConnectionSocket[data.room_code].players.splice(index, 1);
                            io.emit('sendToClientRoom:' + data.room_code, storeRoomInConnectionSocket[data.room_code]);
                            io.emit('updateKickUser:' + data.room_code, { uniq_code: player.uniq_code } );
                        }
                    });
                }
                    catch(error) {
                    console.error(error);
                }
            });

            socket.on('startGame', async function (data) {
                data.room_detail.is_play = true;
                data.room_detail.start_game_time = new Date();
                var getLocations = await require('./mongo-service');
                console.log(getLocations);
            });

            socket.on('disconnect', function() {
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
                console.log('Session Connecting: ' + Object.keys(storePlayerInConnectionSocket).length);
             });

          });
    }
 };