var fs = require('fs');
if (!fs.existsSync('logs/player-info.txt')) {
    if (!fs.existsSync('./logs')){
        fs.mkdirSync('./logs');
    }
    fs.createWriteStream('logs/player-info.txt');
}
module.exports = {
    LoggerPlayerInfo : function(playerName) {
        var message = new Date().toLocaleString() + " : Player Name :" + playerName + "\n";
        fs.appendFile('logs/player-info.txt', message, (err) => {
        if (err) throw err;
        });
    }
}