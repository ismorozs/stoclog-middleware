exports.isArray = (obj) => Object.prototype.toString.call(obj) === '[object Array]';

exports.possibleLogs = ['info', 'log', 'error', 'warn', 'test'];

exports.userLogs = ['test'];

exports.maxLoggerCapacity = 20;

exports.awesomeState = { x:1, b: 'string' };