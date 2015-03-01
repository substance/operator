"use strict";

var Test = require('substance-test');
var assert = Test.assert;
var operator = require('../index');
var ArrayOperation = operator.ArrayOperation;

function testTransform(a, b, input, expected) {
  var t = ArrayOperation.transform(a, b);

  var output = ArrayOperation.perform(t[1], ArrayOperation.perform(a, input.slice(0)));
  assert.isArrayEqual(expected, output);

  output = ArrayOperation.perform(t[0], ArrayOperation.perform(b, input.slice(0)));
  assert.isArrayEqual(expected, output);
}

var ArrayOperationTest = function() {
  Test.call(this);
};

ArrayOperationTest.Prototype = function() {

  this.actions = [

    // All cases are tested canonically. No convenience. Completeness.

    // Insert-Insert Transformations
    // --------
    // Cases:
    //  1. `a < b`:   operations should not be affected
    //  2. `b < a`:   dito
    //  3. `a == b`:  result depends on preference (first applied)

    "Transformation: a=Insert, b=Insert (1,2), a < b and b < a", function() {
      var input = [1,3,5];
      var expected = [1,2,3,4,5];
      var a = ArrayOperation.Insert(1, 2);
      var b = ArrayOperation.Insert(2, 4);

      testTransform(a, b, input, expected);
      testTransform(b, a, input, expected);
    },

    // Example:
    //     A = [1,4], a = [+, 1, 2], b = [+, 1, 3]
    //     A  - a ->  [1, 2, 4]   - b' ->   [1,2,3,4]     => b'= [+, 2, 3], transform(a, b) = [a, b']
    //     A  - b ->  [1, 3, 4]   - a' ->   [1,3,2,4]     => a'= [+, 2, 2], transform(b, a) = [a', b]
    "Transformation: a=Insert, b=Insert (3), a == b", function() {
      var input = [1,4];
      var expected = [1,2,3,4];
      var expected_2 = [1,3,2,4];
      var a = ArrayOperation.Insert(1, 2);
      var b = ArrayOperation.Insert(1, 3);

      // in this case the transform is not symmetric
      testTransform(a, b, input, expected);
      testTransform(b, a, input, expected_2);
    },

    // Delete-Delete Transformations
    // --------
    // Cases:
    //  1. `a < b`:   operations should not be affected
    //  2. `b < a`:   dito
    //  3. `a == b`:  second operation should not have an effect;
    //                user should be noticed about conflict

    "Transformation: a=Delete, b=Delete (1,2), a < b or b < a", function() {
      var input = [1,2,3,4,5];
      var expected = [1,3,5];
      var a = ArrayOperation.Delete(1, 2);
      var b = ArrayOperation.Delete(3, 4);

      testTransform(a, b, input, expected);
      testTransform(b, a, input, expected);
    },

    "Transformation: a=Delete, b=Delete (3), a == b", function() {
      var input = [1,2,3];
      var expected = [1,3];
      var a = ArrayOperation.Delete(1, 2);
      var b = ArrayOperation.Delete(1, 2);

      testTransform(a, b, input, expected);
      testTransform(b, a, input, expected);
    },

    // Insert-Delete Transformations
    // --------
    // Cases: (a = insertion, b = deletion)
    //  1. `a < b`:   b must be shifted right
    //  2. `b < a`:   a must be shifted left
    //  3. `a == b`:  ???

    //     A = [1,3,4,5], a = [+, 1, 2], b = [-, 2, 4]
    //     A  - a ->  [1,2,3,4,5] - b' ->   [1,2,3,5]     => b'= [-, 3, 4]
    //     A  - b ->  [1,3,5]     - a' ->   [1,2,3,5]     => a'= [+, 1, 2] = a
    "Transformation: a=Insert, b=Delete (1), a < b", function() {
      var input = [1,3,4,5];
      var expected = [1,2,3,5];
      var a = ArrayOperation.Insert(1, 2);
      var b = ArrayOperation.Delete(2, 4);

      testTransform(a, b, input, expected);
      testTransform(b, a, input, expected);
    },

    //     A = [1,2,3,5], a = [+,3,4], b = [-,1,2]
    //     A  - a ->  [1,2,3,4,5] - b' ->   [1,3,4,5]     => b'= [-,1,2] = b
    //     A  - b ->  [1,3,5]     - a' ->   [1,3,4,5]     => a'= [+,2,4]
   "Transformation: a=Insert, b=Delete (2), b < a", function() {
      var input = [1,2,3,5];
      var expected = [1,3,4,5];
      var a = ArrayOperation.Insert(3, 4);
      var b = ArrayOperation.Delete(1, 2);

      testTransform(a, b, input, expected);
      testTransform(b, a, input, expected);
    },

    //     A = [1,2,3], a = [+,1,4], b = [-,1,2]
    //     A  - a ->  [1,4,2,3] - b' ->   [1,4,3]     => b'= [-,2,2]
    //     A  - b ->  [1,3]     - a' ->   [1,4,3]     => a'= [+,1,4] = a
    "Transformation: a=Insert, b=Delete (3), a == b", function() {
      var input = [1,2,3];
      var expected = [1,4,3];
      var a = ArrayOperation.Insert(1, 4);
      var b = ArrayOperation.Delete(1, 2);

      testTransform(a, b, input, expected);
      testTransform(b, a, input, expected);
    },

    "Delete 3: [1,2,3,4,5] -> [1,2,4,5]", function() {
      var input = [1,2,3,4,5];
      var expected = [1,2,4,5];

      var op = ArrayOperation.Delete(2, 3);
      var output = op.apply(input);

      assert.isArrayEqual(expected, output);
    }
  ];
};
ArrayOperationTest.Prototype.prototype = Test.prototype;
ArrayOperationTest.prototype = new ArrayOperationTest.Prototype();

Test.registerTest(['Substance.Operator', 'Array Operation'], new ArrayOperationTest());
