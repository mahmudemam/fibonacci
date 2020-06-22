const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const pg = require('pg');
const redis = require('redis');

const keys = require('./keys');

// Express Setup
const server = express();
server.use(cors());
server.use(bodyParser.json());

// Postgres Setup
const pgClient = new pg.Pool({
    host: keys.pgHost,
    port: keys.pgPort,
    database: keys.pgDatabase,
    user: keys.pgUser,
    password: keys.pgPassword
});
pgClient.on('error', () => console.log("CONNECTION LOST !!!"));
pgClient.query('CREATE TABLE IF NOT EXISTS values (number INT)')
    .catch(console.log);

// Redis Setup
const redisClient = redis.createClient({
    host: keys.redisHost,
    port: keys.redisPort,
    retry_strategy: () => 1000
});

// App routes
server.get('/', (req, res) => res.send('Hello there'));

server.get('/values/all', async (req, res) => {
    const values = await pgClient.query('SELECT * from values');
    res.send(values.rows);
});

server.get('/values/current', (req, res) => {
    redisClient.hgetall('values', (err, values) => res.send(values));
});

server.post('/values', async (req, res) => {
    const index = req.body.index;

    if (parseInt(index) > 40) return res.status(422).send('Index too high');

    redisClient.hset("values", index, "Not set yet");
    redisClient.publish("insert", index);

    pgClient.query('INSERT INTO values(number) VALUES($1)', [index]).catch(console.log);

    res.send({ working: true });
})

server.listen(5000, () => console.log('listening'));
