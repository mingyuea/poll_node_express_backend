const express = require('express');
const bodyParser = require('body-parser');
const MongoClient = require('mongodb').MongoClient;
const ObjectId = require('mongodb').ObjectID;
const assert = require('assert');

const dbUrl = 'mongodb://mingyue:Secure1@ds133920.mlab.com:33920/expresstestdb';
const dbName = 'expresstestdb';
const collName = 'quotes';

const app = express();

MongoClient.connect(dbUrl, (err, client) => {
	if(err) console.log(err);

	db = client.db(dbName);
});

app.use(bodyParser.urlencoded({extended: true}));

app.use(bodyParser.json());

app.use((req, res, next) => {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
  next();
});


app.get('/init', (req, res) => {
	db.collection(collName).find().toArray((err, data) => {
		let sendData = data.map(dataObj => ({
			id: dataObj._id,
			pollName: dataObj.pollName
		}));
		res.send(sendData);
	})
});

app.get('/stored', (req, res) => {
	const sendRes = function(sendObj){
		console.log(sendObj);
	};
	let pollId = req.query.id;
	let pollCursor = db.collection(collName).find({"_id": ObjectId(pollId)}).project({_id: 0, pollName: 0}).toArray(function(err, data, callback){
				if(err) return err;

				let cateSum = 0;
				let dataObj = data[0];
				let cateArr = [];

				for (let category in dataObj){
					cateSum += Number(dataObj[category]);
				}
					
				for (var cate in dataObj){
					let resObj = {
						"category": "",
						"percentage": 0
					};

					resObj.category = cate;
					if(cateSum == 0){
						resObj.percentage = 0;
					}
					else{
						resObj.percentage =(Math.round((Number(dataObj[cate]) / cateSum) * 100)) + '%';			
					}
					cateArr.push(resObj);
				}
				res.send(cateArr);
			});
	
});

app.post('/stored', (req, res) => {

	let pollId = req.body.pollId;
	if(Number(pollId) == 0){
		let newPollObj = req.body.pollBody;
		newPollObj["pollName"] = req.body.pollName;

		db.collection(collName).insertOne(newPollObj, (err, r) => {
			if(err) return err;
			assert.equal(1, r.insertedCount);

			res.send({'insert': true});
		});
	}
	else{
		let updateObj = {};

		updateObj[req.body.update] = 1;

		db.collection(collName).findOneAndUpdate({"_id": ObjectId(pollId)}, {$inc: updateObj}, {
			returnOriginal: false,
			upsert: true
		}, (err, r) => {
			assert.equal(null, err);
		});

		res.send(true);
	}
});

app.listen(process.env.PORT || 5003, () => 
	console.log('app is lisenting on port 5003')
);