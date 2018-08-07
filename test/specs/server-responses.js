const assert = require('assert');
const http = require('http');

const { makeRequest } = require('../main');
const {
  isArray,
  maxLogerCapacity,
  userLogs,
  awesomeState
} = require('../common');

describe('Stoclog middleware', function() {
  describe('connect', function() {

    it('should return user defined types of logs', function(done) {
      
      makeRequest('connect', (data) => {
        assert.deepEqual(data, userLogs);
        done();
      });
    });
  });

  describe('get', function () {
    it('should return all logs', function (done) {

      makeRequest('get, all', (data) => {
        assert(data.length, maxLogerCapacity);
        data.forEach((log) => {
          assert.ok(typeof log.method === 'string');
          assert.ok(isArray(log.args))
        });
        done();
      });
    });

    it('should return only logs of particular type', function (done) {
      const type = 'warn';

      makeRequest('get,' + type, (data) => {

        data.forEach((log) => assert(log.method === type));
        done();
      });
    });

    it('should return particular number of logs of particular type', function (done) {
      const type = 'warn';
      const number = 3;

      makeRequest('get,' + type + ',' + number, (data) => {

        assert(data.length === number);
        data.forEach((log) => assert(log.method === type));
        done();
      });
    });

  });

  describe('remove', function () {
    const type = 'warn';

    it('should remove particular logs', function (done) {
      
      makeRequest('remove,' + type, (data, status) => {
        assert(status, 200);
        done();
      });
    });

    it('should not find removed logs', function (done) {

      makeRequest('get,' + type, (data, status) => {
        assert.ok(!data.length);
        done();
      });
    });

    it('should remove all logs', function (done) {
      
      makeRequest('remove, all', (data, status) => {
        assert(status, 200);
        done();
      });
    });

    it('should not find any logs', function (done) {
      
      makeRequest('get, all', (data, status) => {
        assert.ok(!data.length);
        done();
      });
    });

  });

  describe('getstate', function() {

    it('should return saved state', function(done) {
      
      makeRequest('getstate, awesomeState', (data) => {
        assert(data, awesomeState);
        done();
      });
    });
  });

});
