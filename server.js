var express    = require('express');        // call express
var app        = express();                 // define our app using express
var bodyParser = require('body-parser');
var cors = require('cors')
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
var http = require('http').Server(app);
var io = require('socket.io')(http);
app.use(cors());

var spyfallService = require('./utils/socket-service');
spyfallService.spyfallSocketService(io);

var port = process.env.PORT || 3000;
http.listen(port, function () {
  console.log('listening on *:3000');
});
