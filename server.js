var express = require('express'),
    bodyParser = require('body-parser'),
    multiparty = require('connect-multiparty'),
    mongodb = require('mongodb'),
    ObjectId = require('mongodb').ObjectId,
    fs = require('fs');

var app = express();

var db = new mongodb.Db(
    'instagram',
    new mongodb.Server('mongo', 27017, {}),
    {}
);

app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(multiparty());

// Criando um novo middleware para tratar as requisições de preflight request
// Preflight são requisições que, geralmente, atualizam dados: POST, PUT e DELETE.
// Este middlware será executado em todas as funções, então posso trazer os res.setHeader() pra cá

app.use(function(req, res, next) {

    res.setHeader('Access-Control-Allow-Origin', '*'); // Recebe e responde requisições de todas as origens
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE'); // Aceita estes verbos HTTP nas requisições
    res.setHeader('Access-Control-Allow-Headers', 'content-type'); // Permite que a origem altere o content-type
    res.setHeader('Access-Control-Allow-Credentials', true);

    next();
});

app.listen(4200, function() {
    console.log('Servidor online na porta 4200');
});




app.get('/', function(req, res) {
    res.send({ msg: 'olá' });
});

// POST

app.post('/api', function(req, res) {
    var formData = req.body;

    // res.setHeader('Access-Control-Allow-Origin', '*');

    var new_filename = new Date().getTime() + '-' + req.files.arquivo.originalFilename;
    var path_origem = req.files.arquivo.path;
    var path_destino = 'uploads/' + new_filename;

    // [Error: EXDEV: cross-device link not permitted, rename 'PATH DO ARQUIVO DE ORIGEM' -> 'PATH DE DESTINO']
    // fs.rename(path_origem, path_destino, function(err) {
    //     console.log('ERRO: ', err)
    // });

    // Lê o arquivo original
    fs.readFile(path_origem, function(err, data) {

        // Grava o novo arquivo
        fs.writeFile(path_destino, data, function(err) {
            if (!err) {

                var inserir = {
                    titulo: formData.titulo,
                    url_imagem: new_filename
                }

                db.open(function(err, client) {
                    client.collection('postagens', function(err, collection) {
                        collection.insert(inserir, function(err, result) {
                            res.json({ status: 'ok' });
                            client.close();
                        });
                    });
                });

            }
        });

        // Remove o arquivo original
        fs.unlink(path_origem, function(err) {});
    });

});

// GET

app.get('/api', function(req, res) {

    // res.setHeader('Access-Control-Allow-Origin', '*');

    db.open(function(err, client) {
        client.collection('postagens', function(err, collection) {
            collection.find().toArray(function(err, results) {
                res.json(results);
                client.close();
            });
        });
    });
});

// GET IMAGES

app.get('/image/:image', function(req, res) {
    var image = req.params.image;

    fs.readFile('./uploads/' + image, function(err, data) {
        if (err) console.log(err);

        res.writeHead(200, { 'content-type': 'image/png' });
        res.end(data);
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

    // res.setHeader('Access-Control-Allow-Origin', '*');

    var id = req.params.id;
    var comentario = req.body.comentario;

    res.send(comentario);

    /*
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
    */
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