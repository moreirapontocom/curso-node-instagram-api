var express = require('express'),
    bodyParser = require('body-parser'),
    mongodb = require('mongodb');

var app = express();

var db = new mongodb.Db(
    'instagram',
    new mongodb.Server('mongo', 27017, {}),
    {}
);

app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

app.listen(4200, function() {
    console.log('Servidor online na porta 4200');
});




app.get('/', function(req, res) {
    res.send({ msg: 'olá' });
});

app.post('/api', function(req, res) {
    var formData = req.body;

    db.open(function(err, client) {
        client.collection('postagens', function(err, collection) {
            collection.insert(formData, function(err, result) {
                res.json({ status: 'ok' });
                client.close();
            });
        });
    });
});