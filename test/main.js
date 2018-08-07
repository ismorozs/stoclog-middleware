const { spawn } = require('child_process');
const Mocha = require('mocha');
const fs = require('fs');
const path = require('path');
const http = require('http');

let SERVER_PORT = 0;

exports.makeRequest = function (args, cb) {
  return http.get({
    host: 'localhost',
    port: SERVER_PORT,
    headers: { 'x-operation-with-serverside-logs': args }
  },
  (res) => {
    let body = '';
    res.on('data', (buffer) => body += buffer.toString());
    res.on('end', () =>
      cb(
        JSON.parse(body),
        res.statusCode
      )
    );
  });
}

const testServers = spawn(
  'node', [__dirname + '/test-server.js'], {
  stdio: ['pipe', 'pipe', 'pipe', 'ipc']
});

testServers.stdout.on('data', (data) => {
  console.log(`server: ${data}`);
});

testServers.stderr.on('data', (data) => {
  console.log(`server error: ${data}`);
});

testServers.on('exit', () => {
  console.log('Test server is stopped')
});

testServers.on('message', (message) => {
  SERVER_PORT = message.port;
  runTests();
});

function runTests () {
  const mocha = new Mocha();
  const testDir = __dirname + '/specs';

  fs.readdirSync(testDir).forEach((file) => mocha.addFile( path.join( testDir, file )));

  mocha.run(() => testServers.kill('SIGINT'));
}

