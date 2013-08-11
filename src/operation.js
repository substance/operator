"use strict";

// Import
// ========

var util   = require('substance-util');
var errors   = util.errors;

var OperationError = errors.define("OperationError", -1);
var Conflict = errors.define("Conflict", -1);

var Operation = function() {};

Operation.Prototype = function() {

  this.clone = function() {
    throw new Error("Not implemented.");
  };

  this.apply = function() {
    throw new Error("Not implemented.");
  };

  this.invert = function() {
    throw new Error("Not implemented.");
  };

  this.hasConflict = function() {
    throw new Error("Not implemented.");
  };

};

Operation.prototype = new Operation.Prototype();

Operation.conflict = function(a, b) {
  var conflict = new errors.Conflict("Conflict: " + JSON.stringify(a) +" vs " + JSON.stringify(b));
  conflict.a = a;
  conflict.b = b;
  return conflict;
};

Operation.OperationError = OperationError;
Operation.Conflict = Conflict;

// Export
// ========

module.exports = Operation;
