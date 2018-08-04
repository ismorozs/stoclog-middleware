var decycle = require('json-decycle').decycle;

var SPECIAL_HEADER_NAME = 'x-operation-with-serverside-logs';

module.exports = function (server, opts) {

  opts = Object.assign({
    maxLoggerCapacity: 20,
  }, opts || {});

  var logsStorage = [];

  function toClient () {
    var args = Array.prototype.slice.call(arguments);
    if (args.length === 1) {
      args = args[0];
    }

    logsStorage.push( JSON.stringify( args,  decycle() ));

    if (logsStorage.length > opts.maxLoggerCapacity) {
      logsStorage.shift();
    }
  }

  if (!opts.saveLogFuncName) {
    var oldConsoleLog = console.log;

    console.log = function () {
      var args = Array.prototype.slice.call(arguments);
      oldConsoleLog.apply(console, args);
      toClient.apply(this, args);
    }

  } else {
    console[opts.saveLogFuncName] = toClient;
  }

  var existingListeners = server.listeners('request').slice(0);
  server.removeAllListeners('request');

  server.on('request', function (req, res) {

    if (req.headers[SPECIAL_HEADER_NAME]) {
      var operationDetails = req.headers[SPECIAL_HEADER_NAME].split(',');

      var returnValue;

      switch (operationDetails[0]) {

        case 'get':
          var logsToReturn = logsStorage.slice(-operationDetails[1]);
          returnValue = '[' + logsToReturn.join(",") + ']';
          res.writeHead(200, 'logs fetched');
          break;

        case 'remove':
          logsStorage.length = 0;
          res.writeHead(204, 'server logs removed successfully');
          break;

        default:
          res.writeHead(400, 'unable to process request: ' + operationDetails[0]);
      }

      return res.end(returnValue);
    }

    for (var i = 0; i < existingListeners.length; i++) {
      existingListeners[i].call(server, req, res);
    }
  });

};
