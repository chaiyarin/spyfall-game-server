var MongoClient = require('mongodb').MongoClient;
var url = `mongodb://${process.env.SPYFALL_MONGO_USERNAME}:${process.env.SPYFALL_MONGO_PASSWORD}@${process.env.SPYFALL_MONGO_HOST}:${process.env.SPYFALL_MONGO_PORT}/${process.env.SPYFALL_MONGO_DB_NAME}`;

module.exports = (async function() {

  const client = await MongoClient.connect(url, {
    useNewUrlParser: true
  });

  const db = client.db('spyfall');

  const getLocations = await db.collection("locations").find({}).toArray();

  return getLocations;
 })();