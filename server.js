var express = require('express');
var app = require('express')();
const cors = require('cors');
app.use(cors());
var http = require('http').Server(app);
var io = require('socket.io')(http);
io.origins('*:*');
var bodyParser = require('body-parser');
app.set('view engine', 'ejs');
app.use(bodyParser.urlencoded({ extended: false }))
app.use(bodyParser.json())

app.use(express.static(__dirname));

app.get('/', function (req, res) {
  res.sendFile(__dirname + '/index.html');
});

var MongoClient = require('mongodb').MongoClient;
var url = `mongodb://${process.env.SPYFALL_MONGO_USERNAME}:${process.env.SPYFALL_MONGO_PASSWORD}@${process.env.SPYFALL_MONGO_HOST}:${process.env.SPYFALL_MONGO_PORT}/${process.env.SPYFALL_MONGO_DB_NAME}`;
// var url = "mongodb://localhost:27017/spyfall";

var obj = {};
var room_detail = {};
var room_permenent_id = {};

io.on('connection', function (socket) {
  const _id = socket.id;
  console.log('เข้า');

  var key = socket.handshake.query.room_code;
  var temp_userlist = new Array();
  if(obj.hasOwnProperty(key)){
    console.log('เพิ่มเพื่อนเข้าห้อง : ', socket.handshake.query.room_code);
    console.log({
      key: _id,
      myid: socket.handshake.query.myid,
      nickname: socket.handshake.query.nickname,
      room_code: socket.handshake.query.room_code,
      position: '',
      order: 0
    });
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
    if(room_permenent_id[key].indexOf(socket.handshake.query.myid) == -1){
      room_detail[key] = { start_time: null, game_start_already: false};
      room_permenent_id[key].push(socket.handshake.query.myid);
    }else{
      console.log("คนเดิมกลับเข้ามาก้ีคือ : " + socket.handshake.query.nickname);
    }
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
    room_permenent_id[key] = new Array();
    room_permenent_id[key].push(socket.handshake.query.myid);
    room_detail[key] = { start_time: null, game_start_already: false};
  }

  io.emit(socket.handshake.query.room_code, obj[key]);
  io.emit('room-detail-' + socket.handshake.query.room_code, room_detail[key]);
  console.log(room_detail);

  socket.on('kick-user', function (data) {
    console.log('โดนเตะออก');
    console.log(data);
    obj[data.room_code].forEach(function(element, index) {
      if(element.myid == data.myid || element.key == data.key){
        console.log('ก่อนเตะ');
        console.log(obj[data.room_code]);
        obj[data.room_code].splice(index, 1);
        console.log('หลังเตะ');
        console.log(obj[data.room_code]);
        io.emit(data.room_code, obj[data.room_code]);
        io.emit('kick-' + data.room_code, element.myid);
      }
    });
  });

  socket.on('endgame', function (data) {
    room_detail[key].game_start_already = false;
    room_detail[key].start_time = null;
    io.emit('room-detail-' + data.room_code, room_detail[key]);
    io.emit('endgame-' + data.room_code, { game_end: true });
  });

  socket.on('startgame', function (room_code) {
    var index_spy = Math.floor(Math.random()*obj[room_code].length);
    var order_lists = new Array();
    var locations = [];
    for(var i=0; i< obj[room_code].length; i++) {
      order_lists.push(i+1);
    }
    MongoClient.connect(url, { useNewUrlParser: true }, function(err, db) {
      if (err) throw err;
      var dbo = db.db("spyfall");
      dbo.collection("locations").find({}).toArray(function(err, result) {
        if (err) throw err;
        locations = result;
        locations = shuffle(locations);
        order_lists = shuffle(order_lists);
        obj[room_code].forEach(function(element, index) {
          obj[room_code][index].position = locations[0].peoples[Math.floor(Math.random() * locations[0].peoples.length)];
          obj[room_code][index].order = order_lists.pop();
        });
        obj[room_code][index_spy].position = 'spy';
        var game_detail = {
          location : locations[0].name,
          timer: 600,
          friend_list: obj[room_code],
          location_list: result
        }
        room_detail[key].game_start_already = true;
        room_detail[key].start_time = new Date();
        io.emit('game-start-' + room_code, game_detail);
        io.emit('room-detail-' + room_code, room_detail[key]);
        db.close();
      });
    });
  });

  socket.on('disconnect', function () {
    console.log('ออก');
    for (var key in obj) {
      obj[key].forEach(function(element, index) {
        // console.log(element);
        if(element.key == _id){
          console.log('คนที่ออกคือ : ');
          console.log(obj[key][index]);
          obj[key].splice(index, 1);
          io.emit(key, obj[key]);
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
