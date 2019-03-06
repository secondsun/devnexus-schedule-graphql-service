process.env["NODE_TLS_REJECT_UNAUTHORIZED"] = 0;

const { app } = require('./server')

app.get('/', (req, res) => res.send('ok'))

