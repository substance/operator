(function(root) { "use strict";

// Import
// ========

var _,
    errors,
    util,
    Chronicle,
    Compound;

errors.define("OperationError", -1);
errors.define("Conflict", -1);

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

  this.transform = function(other) {
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

// Export
// ========

if (typeof exports !== 'undefined') {
  module.exports = TextOperation;
} else {
  Chronicle.ot = Chronicle.ot || {};
  Chronicle.ot.TextOperation = TextOperation;
}


})(this);