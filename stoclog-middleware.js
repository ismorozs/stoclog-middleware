var decycle = require('json-decycle').decycle;

var SPECIAL_HEADER_NAME = 'x-operation-with-serverside-logs';
var NATIVE_METHODS = Object.keys(console);

var logsStorage = [];
var objectsStorage = {};

module.exports = function (server, opts) {

  opts = Object.assign({
    maxLoggerCapacity: 50,
    userLogs: [],
  }, opts || {});

  var allLogMethods = NATIVE_METHODS.concat(opts.userLogs);

  allLogMethods.forEach((method) => {
    var oldConsoleMethod;

    if (!!~NATIVE_METHODS.indexOf(method)) {
      oldConsoleMethod = console[method];
    } else {
      oldConsoleMethod = console.log;
    }

    console[method] = function () {
      var args = Array.prototype.slice.call(arguments);
      oldConsoleMethod.apply(console, args);
      toClient.apply(this, [method].concat(args));
    }
  });

  console.saveState = function (pointer, obj) {
    objectsStorage[pointer] = prepareForStoring(obj);
  }

  var existingListeners = server.listeners('request').slice(0);
  server.removeAllListeners('request');

  server.on('request', function (req, res) {
    if (req.headers[SPECIAL_HEADER_NAME]) {
      middlewareListener(req, res);
      return;
    }

    for (var i = 0; i < existingListeners.length; i++) {
      existingListeners[i].call(server, req, res);
    }
  });

  function middlewareListener (req, res) {
    var operationDetails = req.headers[SPECIAL_HEADER_NAME].split(',');
    var operation = operationDetails[0].trim();
    var type = operationDetails[1].trim();
    var logsNumber = operationDetails[2].trim();

    var returnValue = '';

    try {
      switch (operation) {
        case 'get':
          var logsToReturn;

          if (type !== 'all') {
            logsToReturn = logsStorage.filter((log) => JSON.parse(log).method === type)
          } else {
            logsToReturn = logsStorage;
          }

          logsToReturn = logsToReturn.slice(-logsNumber);
          returnValue = '[' + logsToReturn.join(",") + ']';

          res.writeHead(200, 'logs are fetched');
          break;

        case 'getstate':
          returnValue = objectsStorage[type];

          if (!returnValue) {
            throw new Error(", key: '" + type + "' doesn't exist");
          }

          res.writeHead(200, 'specified object is fetched');
          break;

        case 'remove':
          if (type !== 'all') {
            logsStorage = logsStorage.filter((log) => JSON.parse(log).method !== type);
          } else {
            logsStorage.length = 0;
          }

          res.writeHead(200, 'server logs were removed successfully');
          break;

        case 'connect':
          returnValue = JSON.stringify(opts.userLogs);
          break;

        default:
          throw new Error;
      }

    } catch (e) {
      res.writeHead(400, 'unable to handle request: ' + operation  + e.message);
    }

    return res.end(returnValue);
  }

  function toClient () {
    var method = arguments[0];
    var args = Array.prototype.slice.call(arguments, 1);

    logsStorage.push(
      prepareForStoring({ method, args })
    );

    if (logsStorage.length > opts.maxLoggerCapacity) {
      logsStorage.shift();
    }
  }

  function prepareForStoring (obj) {
    return JSON.stringify(obj,  decycle());
  }

};
