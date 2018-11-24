var MongoClient = require('mongodb').MongoClient;
var json_locations = require('../seed.json');
var url = `mongodb://${process.env.SPYFALL_MONGO_USERNAME}:${process.env.SPYFALL_MONGO_PASSWORD}@${process.env.SPYFALL_MONGO_HOST}:${process.env.SPYFALL_MONGO_PORT}/${process.env.SPYFALL_MONGO_DB_NAME}`;

module.exports = (async function() {

  const client = await MongoClient.connect(url, {
    useNewUrlParser: true
  });

  const db = client.db('spyfall');

  db.collection("locations").countDocuments(async function (err, count) {
    if (!err && count === 0) {
      await db.collection("locations").insertMany(json_locations, function(err,result) {
        if (err) {
          console.log(err);
        } else {
          console.log('Insert locations Success');
        }
      });
    }
  });

  const getLocations = await db.collection("locations").find({}).toArray();

  return getLocations;
 })();