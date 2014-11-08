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

Helpers.cotransform = function(graph, adapter, op) {
  if (op.type === "create") {
    adapter.create.call(adapter, op.val);
  }
  else if (op.type === "delete") {
    adapter.delete.call(adapter, op.val);
  }
  // type = 'update' or 'set'
  else {
    var prop = graph.resolve(op.path);
    if (prop === undefined) {
      throw new Error("Key error: could not find element for path " + JSON.stringify(op.path));
    }
    var value = prop.get();

    var oldValue;

    // Attention: this happens when updates and deletions are within one compound
    // The operation gets applied, finally the node is deleted.
    // Listeners are triggered afterwards, so they can not rely on the node being there
    // anymore.
    // However, this is not a problem. We can ignore this update as there will come
    // a deletion anyways.
    if (value === undefined) {
      return;
    }

    if (op.type === "set") {
      oldValue = op.original;
    } else {
      var invertedDiff = Helpers.invert(op.diff, prop.baseType);
      oldValue = invertedDiff.apply(_.clone(value));
    }

    adapter.update.call(adapter, prop.node, prop.key, value, oldValue);
  }
};

module.exports = Helpers;
