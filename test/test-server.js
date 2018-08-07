const http = require('http');

const {
  possibleLogs,
  maxLoggerCapacity,
  userLogs,
  awesomeState
} = require('./common');

const server = http.createServer();

require('../stoclog-middleware')(server, {
  userLogs,
  maxLoggerCapacity
});

server.listen(() => {
  console.log('Test server is started')

  for (let i = 0; i < maxLoggerCapacity; i++) {
    console[ possibleLogs[ i % possibleLogs.length ] ]();
  }

  console.saveState('awesomeState', awesomeState);

  process.send({ port: server.address().port });
});
