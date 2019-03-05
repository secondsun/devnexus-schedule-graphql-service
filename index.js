process.env["NODE_TLS_REJECT_UNAUTHORIZED"] = 0;

const { app, server } = require('./server')
var cors = require('cors')
const port = 4000
app.get('/', (req, res) => res.send('ok'))
app.listen({ port }, () =>
  console.log(`🚀 Server ready at http://localhost:${port}${server.graphqlPath}`)
)
