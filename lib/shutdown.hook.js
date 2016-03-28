var Promise      = require('bluebird'),
    util         = require('util'),
    EventEmitter = require('events').EventEmitter;

function ShutdownHook(options) {
  options = options || {}
  this.shutdownFunctions = {}
  this.timeout = options.timeout || 10000;
}

util.inherits(ShutdownHook, EventEmitter);

ShutdownHook.prototype.register = function() {
  var self = this;

  // Standard OS signals
  process.on('SIGTERM', this.shutdown.bind(this));
  process.on('SIGINT', this.shutdown.bind(this));

  process.on('message', function(message) {
    if (message == 'shutdown') {
      self.shutdown();
    }
  })
}

ShutdownHook.prototype.exit = function(code) {
  process.exit(code);
}

ShutdownHook.prototype.shutdown = function() {
  var self = this;
  return Promise.try(function() {
    self.emit('ShutdownStarted');

    return Promise.each(Object.keys(self.shutdownFunctions), function(componentName) {
      self.emit('ComponentShutdown', {name: componentName})
      var shutdownFn = self.shutdownFunctions[componentName];
      return shutdownFn();
    }).timeout(self.timeout, "Shutdown operation timed out after " + self.timeout + 'ms')
      .then(function() {
        self.emit('ShutdownEnded', {code: 0});
        self.exit(0);

      })
      .catch(function(err) {
        self.emit('ShutdownEnded', {code: 1, error: err});
        self.exit(1);
      })
  }).catch(function(error) {
    console.error('Unexpected error during shutdown sequence:\n' + error.stack);
    self.exit(1);
  })
}

ShutdownHook.prototype.add = function(name, shutdownFn) {
  if (typeof name === 'function') {
    shutdownFn = name;
    name = 'anonymous#' + (Object.keys(this.shutdownFunctions).length + 1)
  }

  if (typeof shutdownFn !== 'function') {
    throw new Error('shutdownFn for ' + name + ' must be a function');
  }

  this.shutdownFunctions[name] = shutdownFn;
}

module.exports = ShutdownHook