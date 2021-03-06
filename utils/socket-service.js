var logger = require('./logs-service');
var utilService = require('./util-service');
var storePlayerInConnectionSocket = {};
var storeRoomInConnectionSocket = new Array();
var roomDetailTemp = {};
var playerTemp = new Array();

module.exports = {
    spyfallSocketService: function(io){
        io.on('connection', function (socket) {
            const _id = socket.id;
            var roomCode = socket.handshake.query.room_code;
            var uniqId = socket.handshake.query.uniq_code;
            var name = socket.handshake.query.name;

            // ส่ง roomdetail ไปที่ roomcode และ uniqId ของคนนั้น ในกรณีเกมส์ในห้องนั้นเล่นอยู่
            if(typeof(storeRoomInConnectionSocket[roomCode]) != 'undefined' && storeRoomInConnectionSocket[roomCode].is_play){
                console.log('Resume Game');
                io.emit('resumeGame:' + roomCode + ':' + uniqId , storeRoomInConnectionSocket[roomCode]);
                // Add User To Room When User Resume
                playerTemp = new Array();
                storePlayerInConnectionSocket[socket.id] = uniqId;
                playerTemp = storeRoomInConnectionSocket[roomCode].players;
                var PlayerResume = { uniq_code: uniqId,
                                        name: name,
                                        is_spy: false,
                                        position: '',
                                        is_own_room: false };
                playerTemp.push(PlayerResume);
                storeRoomInConnectionSocket[roomCode].players = playerTemp;
                logger.LoggerPlayerInfo(name + ' -> Resume Join Room');
                io.emit('sendToClientRoom:' + roomCode, storeRoomInConnectionSocket[roomCode]);
                // End Add User To Room When User Resume
            }

            socket.on('createRoom', function (data) { // roomDetail , Player
                console.log('Create Room', data);
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
                console.log('Join Room', data);
                if(storeRoomInConnectionSocket.hasOwnProperty(data.room_code)){
                    playerTemp = new Array();
                    storePlayerInConnectionSocket[socket.id] = data.player.uniq_code;
                    playerTemp = storeRoomInConnectionSocket[data.room_code].players;
                    playerTemp.push(data.player);
                    storeRoomInConnectionSocket[data.room_code].players = playerTemp;
                    logger.LoggerPlayerInfo(data.player.name + ' -> Join Room');
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
                            if(storeRoomInConnectionSocket[data.room_code].players.length == 0){
                                delete storeRoomInConnectionSocket[data.room_code];
                                console.log('Delete Room Beacuse User Is Empty');
                            }
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
                console.log('Start Game ', data);
                var getLocations = await require('./mongo-service');
                var randomLocation = Math.floor(Math.random() * getLocations.length);
                var positionLength =  getLocations[randomLocation].peoples.length;
                var randomSpy = Math.floor(Math.random() * data.room_detail.players.length);
                var orderPlayerArray = utilService.generateOrderLength(data.room_detail.players.length);
                orderPlayerArray = utilService.shuffle(orderPlayerArray);
                data.room_detail.is_play = true;
                data.room_detail.start_game_time = new Date();
                data.room_detail.location = getLocations[randomLocation].name;
                data.room_detail.players[randomSpy].is_spy = true;
                data.room_detail.locations = getLocations;
                data.room_detail.players.forEach(function(player, index) {
                    data.room_detail.players[index].order = orderPlayerArray.pop();
                    if(player.is_spy){
                        data.room_detail.players[index].position = '';
                        return;
                    }
                    data.room_detail.players[index].position = getLocations[randomLocation].peoples[Math.floor(Math.random() * positionLength)];
                });
                storeRoomInConnectionSocket[data.room_detail.room_code].is_play = true;
                storeRoomInConnectionSocket[data.room_detail.room_code].start_game_time = data.room_detail.start_game_time;
                io.emit('updateUIRenderGame:' + data.room_detail.room_code, data.room_detail);
            });

            socket.on('endGame', function (data) {
                console.log('End Game');
                storeRoomInConnectionSocket[data.room_code].is_play = false;
                storeRoomInConnectionSocket[data.room_code].start_game_time = null;
                io.emit('sendToClientRoom:' + data.room_code, storeRoomInConnectionSocket[data.room_code]);
            });

            socket.on('disconnect', function() {
                var playerUniqCode = storePlayerInConnectionSocket[socket.id];
                for(var roomCode in storeRoomInConnectionSocket){
                    storeRoomInConnectionSocket[roomCode].players.forEach(function(player, index) {
                        if(player.uniq_code == playerUniqCode){
                            storeRoomInConnectionSocket[roomCode].players.splice(index, 1);
                            io.emit('sendToClientRoom:' + roomCode, storeRoomInConnectionSocket[roomCode]);
                            if(storeRoomInConnectionSocket[roomCode].players.length == 0){
                                delete storeRoomInConnectionSocket[roomCode];
                                console.log('Delete Room Beacuse User Is Empty');
                            }
                        }
                    });
                }
                delete storePlayerInConnectionSocket[socket.id];
                console.log('Now Server Have ' + Object.keys(storePlayerInConnectionSocket).length + ' Peoples');
             });

          });
    }
 };