(function(root) { "use strict";

if (typeof exports !== 'undefined') {
  module.exports = {
    Compound: require('./src/compound'),
    ArrayOperation: require('./src/array_operation'),
    TextOperation: require('./src/text_operation'),
    ObjectOperation: require('./src/object_operation')
  };
}

})(this);
