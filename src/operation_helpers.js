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

module.exports = Helpers;
