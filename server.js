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
      nickname: socket.handshake.query.nickname,
      room_code: socket.handshake.query.room_code,
    });
    obj[key] = temp_userlist_has;
  }else{
    console.log('สร้างห้องใหม่ : ' + socket.handshake.query.room_code);
    temp_userlist.push({
      key: _id,
      nickname: socket.handshake.query.nickname,
      room_code: socket.handshake.query.room_code,
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

});

var port = process.env.PORT || 3000;
http.listen(port, function () {
  console.log('listening on *:3000');
});
