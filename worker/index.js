const redis = require('redis');

const client = redis.createClient({
    host: process.env.REDIS_HOST,
    port: process.env.REDIS_PORT,
    retry_strategy: () => 1000,
})

const pub = client.duplicate();

function fib(index) {
    if (index < 2) return 1;
    return fib(index - 1) + fib(index - 2);
}

pub.on('message', (channel, message) => {
    client.hset('values', message, fib(parseInt(message)));
});

pub.subscribe('insert');