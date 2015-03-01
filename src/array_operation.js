"use strict";

var Substance = require('substance');
var Conflict = require('./conflict');

var NOP = "NOP";
var DEL = "delete";
var INS = "insert";

var ArrayOperation = function(options) {

  if (options.type === undefined) {
    throw new Error("Illegal argument: insufficient data.");
  }

  // Insert: '+', Delete: '-', Move: '>>'
  this.type = options.type;

  if (this.type === NOP) return;

  // the position where to apply the operation
  this.pos = options.pos;

  // the string to delete or insert
  this.val = options.val;

  // sanity checks
  if(this.type !== NOP && this.type !== INS && this.type !== DEL) {
    throw new Error("Illegal type.");
  }

  if (this.type === INS || this.type === DEL) {
    if (this.pos === undefined || this.val === undefined) {
      throw new Error("Illegal argument: insufficient data.");
    }
    if (!Substance.isNumber(this.pos) && this.pos < 0) {
      throw new Error("Illegal argument: expecting positive number as pos.");
    }
  }
};

ArrayOperation.fromJSON = function(data) {
  return new ArrayOperation(data);
};

ArrayOperation.Prototype = function() {

  this.clone = function() {
    return new ArrayOperation(this);
  };

  this.apply = function(array) {
    if (this.type === NOP) {
      return array;
    }
    var adapter = (array instanceof ArrayOperation.ArrayAdapter) ? array : new ArrayOperation.ArrayAdapter(array);
    // Insert
    if (this.type === INS) {
      adapter.insert(this.pos, this.val);
    }
    // Delete
    else if (this.type === DEL) {
      adapter.delete(this.pos, this.val);
    }
    else {
      throw new Error("Illegal state.");
    }
    return array;
  };

  this.invert = function() {
    var data = this.toJSON();
    if (this.type === INS) data.type = DEL;
    else if (this.type === DEL) data.type = INS;
    else if (this.type === NOP) data.type = NOP;
    else {
      throw new Error("Illegal state.");
    }
    return new ArrayOperation(data);
  };

  this.hasConflict = function(other) {
    return ArrayOperation.hasConflict(this, other);
  };

  this.toJSON = function() {
    var result = {
      type: this.type,
    };
    if (this.type === NOP) return result;
    result.pos = this.pos;
    result.val = this.val;
    return result;
  };

  this.isInsert = function() {
    return this.type === INS;
  };

  this.isDelete = function() {
    return this.type === DEL;
  };

  this.isNOP = function() {
    return this.type === NOP;
  };
};

Substance.initClass(ArrayOperation);

var _NOP = 0;
var _DEL = 1;
var _INS = 2;

var CODE = {};
CODE[NOP] = _NOP;
CODE[DEL] = _DEL;
CODE[INS] = _INS;

var _hasConflict = [];

_hasConflict[_DEL | _DEL] = function(a,b) {
  return a.pos === b.pos;
};

_hasConflict[_DEL | _INS] = function() {
  return false;
};

_hasConflict[_INS | _INS] = function(a,b) {
  return a.pos === b.pos;
};

/*
  As we provide Move as quasi atomic operation we have to look at it conflict potential.

  A move is realized as composite of Delete and Insert.

  M / I: ( -> I / I conflict)

    m.s < i && m.t == i-1
    else i && m.t == i

  M / D: ( -> D / D conflict)

    m.s === d

  M / M:

    1. M/D conflict
    2. M/I conflict
*/

var hasConflict = function(a, b) {
  if (a.type === NOP || b.type === NOP) return false;
  var caseId = CODE[a.type] | CODE[b.type];
  if (_hasConflict[caseId]) {
    return _hasConflict[caseId](a,b);
  } else {
    return false;
  }
};

var transform0;

function transform_insert_insert(a, b, first) {

  if (a.pos === b.pos) {
    if (first) {
      b.pos += 1;
    } else {
      a.pos += 1;
    }
  }
  // a before b
  else if (a.pos < b.pos) {
    b.pos += 1;
  }

  // a after b
  else  {
    a.pos += 1;
  }

}

function transform_delete_delete(a, b) {

  // turn the second of two concurrent deletes into a NOP
  if (a.pos === b.pos) {
    b.type = NOP;
    a.type = NOP;
    return;
  }

  if (a.pos < b.pos) {
    b.pos -= 1;
  } else {
    a.pos -= 1;
  }

}

function transform_insert_delete(a, b) {

  // reduce to a normalized case
  if (a.type === DEL) {
    var tmp = a;
    a = b;
    b = tmp;
  }

  if (a.pos <= b.pos) {
    b.pos += 1;
  } else {
    a.pos -= 1;
  }

}

transform0 = function(a, b, options) {

  options = options || {};

  if (options.check && hasConflict(a, b)) {
    throw new Conflict(a, b);
  }

  if (!options.inplace) {
    a = Substance.clone(a);
    b = Substance.clone(b);
  }

  if (a.type === NOP || b.type === NOP)  {
    // nothing to transform
  }
  else if (a.type === INS && b.type === INS)  {
    transform_insert_insert(a, b, true);
  }
  else if (a.type === DEL && b.type === DEL) {
    transform_delete_delete(a, b, true);
  }
  else {
    transform_insert_delete(a, b, true);
  }

  return [a, b];
};

var __apply__ = function(op, array) {
  if (Substance.isArray(op)) {
    op = new ArrayOperation(op);
  } else if (!(op instanceof ArrayOperation)) {
    op = ArrayOperation.fromJSON(op);
  }
  return op.apply(array);
};

ArrayOperation.transform = transform0;
ArrayOperation.hasConflict = hasConflict;

ArrayOperation.perform = __apply__;
// DEPRECATED: use ArrayOperation.perform
ArrayOperation.apply = __apply__;

ArrayOperation.Insert = function(pos, val) {
  return new ArrayOperation({type:INS, pos: pos, val: val});
};

ArrayOperation.Delete = function(pos, val) {
  return new ArrayOperation({ type:DEL, pos: pos, val: val });
};

ArrayOperation.create = function(array, spec) {
  var type = spec[0];
  var val, pos;
  if (type === INS || type === "+") {
    pos = spec[1];
    val = spec[2];
    return ArrayOperation.Insert(pos, val);
  } else if (type === DEL || type === "-") {
    pos = spec[1];
    val = array[pos];
    return ArrayOperation.Delete(pos, val);
  } else {
    throw new Error("Illegal specification.");
  }
};

var ArrayAdapter = function(arr) {
  this.array = arr;
};

ArrayAdapter.prototype = {
  insert: function(pos, val) {
    if (this.array.length < pos) {
      throw new Error("Provided array is too small.");
    }
    this.array.splice(pos, 0, val);
  },

  delete: function(pos, val) {
    if (this.array.length < pos) {
      throw new Error("Provided array is too small.");
    }
    if (this.array[pos] !== val) {
      throw new Error("Unexpected value at position " + pos + ". Expected " + val + ", found " + this.array[pos]);
    }
    this.array.splice(pos, 1);
  },

  move: function(val, pos, to) {
    if (this.array.length < pos) {
      throw new Error("Provided array is too small.");
    }
    this.array.splice(pos, 1);

    if (this.array.length < to) {
      throw new Error("Provided array is too small.");
    }
    this.array.splice(to, 0, val);
  }
};
ArrayOperation.ArrayAdapter = ArrayAdapter;

ArrayOperation.NOP = NOP;
ArrayOperation.DELETE = DEL;
ArrayOperation.INSERT = INS;

// Export
// ========

module.exports = ArrayOperation;
