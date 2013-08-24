var Helpers = {};

Helpers.last = function(op) {
  if (op.type === "compound") {
    return op.ops[op.ops.length-1];
  }
  return op;
};

Helpers.each = function(op, iterator, context) {
  if (op.type === "compound") {
    for (var i = 0; i < op.ops.length; i++) {
      var child = op.ops[i];
      if (child.type === "compound") Helpers.each(child, iterator, context);
      else iterator.call(context, child);
    }
  } else {
    iterator.call(context, op);
  }
};

module.exports = Helpers;
