"use strict";

var _ = require('underscore');
var TextOperation = require("./text_operation");
var ArrayOperation = require("./array_operation");

var Helpers = {};

Helpers.last = function(op) {
  if (op.type === "compound") {
    return op.ops[op.ops.length-1];
  }
  return op;
};

// Iterates all atomic operations contained in a given operation
// --------
//
// - op: an Operation instance
// - iterator: a `function(op)`
// - context: the `this` context for the iterator function
// - reverse: if present, the operations are iterated reversely

Helpers.each = function(op, iterator, context, reverse) {
  if (op.type === "compound") {
    var l = op.ops.length;
    for (var i = 0; i < l; i++) {
      var child = op.ops[i];
      if (reverse) {
        child = op.ops[l-i-1];
      }
      if (child.type === "compound") {
        if (Helpers.each(child, iterator, context, reverse) === false) {
          return false;
        }
      }
      else {
        if (iterator.call(context, child) === false) {
          return false;
        }
      }
    }
    return true;
  } else {
    return iterator.call(context, op);
  }
};

Helpers.invert = function(op, type) {
  switch (type) {
  case "string":
    return TextOperation.fromJSON(op).invert();
  case "array":
    return ArrayOperation.fromJSON(op).invert();
  default:
    throw new Error("Don't know how to invert this operation.");
  }
};

// Flattens a list of ops, i.e., extracting any ops from compounds
Helpers.flatten = function(op) {
  var ops;
  if (_.isArray(op)) {
    ops = op;
  } else if (op.type !== "compound") {
    ops = [op];
  } else {
    ops = op.ops.slice(0);
  }
  var flat = [];
  while(ops.length > 0) {
    op = ops.shift();
    if (op.type !== "compound") {
      flat.push(op);
    } else {
      ops = [].concat(op.ops, ops);
    }
  }
  return flat;
};

module.exports = Helpers;
