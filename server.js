var express = require('express');
var app = require('express')();
var http = require('http').Server(app);
var io = require('socket.io')(http);
var bodyParser = require('body-parser');
app.set('view engine', 'ejs');
app.use(bodyParser.urlencoded({ extended: false }))
app.use(bodyParser.json())

app.use(express.static(__dirname));

app.get('/', function (req, res) {
  res.sendFile(__dirname + '/index.html');
});

var obj = {};

io.on('connection', function (socket) {
  const _id = socket.id;

  var key = socket.handshake.query.room_code;
  var temp_userlist = new Array();
  if(obj.hasOwnProperty(key)){
    console.log('เพิ่มเพื่อนเข้าห้อง : ', socket.handshake.query.room_code);
    temp_userlist_has = obj[key];
    temp_userlist_has.push({
      key: _id,
      myid: socket.handshake.query.myid,
      nickname: socket.handshake.query.nickname,
      room_code: socket.handshake.query.room_code,
      position: '',
      order: 0
    });
    obj[key] = temp_userlist_has;
  }else{
    console.log('สร้างห้องใหม่ : ' + socket.handshake.query.room_code);
    temp_userlist.push({
      key: _id,
      myid: socket.handshake.query.myid,
      nickname: socket.handshake.query.nickname,
      room_code: socket.handshake.query.room_code,
      position: '',
      order: 0
    });
    obj[key] = temp_userlist;
  }

  io.emit(socket.handshake.query.room_code, obj);

  socket.on('kick-user', function (data) {
    obj[data.room_code].forEach(function(element, index) {
      if(element.key == data.key){
        obj[data.room_code].splice(index, 1);
        io.emit(data.room_code, obj);
      }
    });
  });

  socket.on('startgame', function (room_code) {
    var index_spy = Math.floor(Math.random()*obj[room_code].length);
    var order_lists = new Array();
    for(var i=0; i< obj[room_code].length; i++) {
      order_lists.push(i+1);
    }
    order_lists = shuffle(order_lists);
    obj[room_code].forEach(function(element, index) {
      obj[room_code][index].position = '';
      obj[room_code][index].order = order_lists.pop();
    });
    obj[room_code][index_spy].position = 'spy';
    var game_detail = {
      location : 'โรงเรียน',
      timer: 600,
      friend_list: obj[room_code]
    }
    io.emit('game-start-' + room_code, game_detail);
  });

  socket.on('disconnect', function () {
    for (var key in obj) {
      obj[key].forEach(function(element, index) {
        console.log(element);
        if(element.key == _id){
          obj[key].splice(index, 1);
          io.emit(key, obj);
        }
      });
    }
    console.log('disconnected : ' + _id);
  });

});

function shuffle(a) {
  var j, x, i;
  for (i = a.length - 1; i > 0; i--) {
      j = Math.floor(Math.random() * (i + 1));
      x = a[i];
      a[i] = a[j];
      a[j] = x;
  }
  return a;
}


var port = process.env.PORT || 3000;
http.listen(port, function () {
  console.log('listening on *:3000');
});
