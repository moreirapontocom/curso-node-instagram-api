var express = require('express'),
    bodyParser = require('body-parser'),
    mongodb = require('mongodb'),
    ObjectId = require('mongodb').ObjectId;

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

// POST

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

// GET

app.get('/api', function(req, res) {
    db.open(function(err, client) {
        client.collection('postagens', function(err, collection) {
            collection.find().toArray(function(err, results) {
                res.json(results);
                client.close();
            });
        });
    });
});

// GET by ID

app.get('/api/:id', function(req, res) {

    // Os _id sempre tem 24 caracteres
    // Se a requisição vier com um _id de 24, vai pesquisar e retornar (o documento ou vazio, caso não exista)
    // Se a requisição vier com um _id diferente de 24 caracteres, vai quebrar. A validação abaixo verifica se é um objeto id válido.

    if (!mongodb.ObjectID.isValid(req.params.id)) {
        res.status(500).json({ status: 'ID inválido' });
        return;
    }

    db.open(function(err, client) {
        client.collection('postagens', function(err, collection) {
            collection.find(ObjectId(req.params.id)).toArray(function(err, results) {
                if (!results.length)
                    res.status(404).json(results);
                else
                    res.json(results);

                client.close();
            });
        });
    });
});

// PUT

app.put('/api/:id', function(req, res) {
    db.open(function(err, client) {
        client.collection('postagens', function(err, collection) {
            collection.update(
                { _id: ObjectId(req.params.id) },
                { $set: { titulo: req.body.titulo } },
                // { $set: req.body }, // Ou assim pra atualizar todos os campos
                {}, // multi. default: false
                function(err, result) {
                    res.json({ status: 'ok' });
                    client.close();
                }
            );
        });
    });
});

// DELETE

app.delete('/api/:id', function(req, res) {
    db.open(function(err, client) {
        client.collection('postagens', function(err, collection) {
            collection.remove({ _id: ObjectId(req.params.id) }, function(err, result) {
                res.json({ status: 'ok' });
                client.close();
            });
        });
    });
});