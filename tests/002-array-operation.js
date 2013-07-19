"use strict";

var Test = require('substance-test');
var assert = Test.assert;
var operator = require('..');
var registerTest = Test.registerTest;

var ArrayOperation = operator.ArrayOperation;

function testTransform(a, b, input, expected) {
  var t = ArrayOperation.transform(a, b);

  var output = ArrayOperation.perform(t[1], ArrayOperation.perform(a, input.slice(0)));
  assert.isArrayEqual(expected, output);

  output = ArrayOperation.perform(t[0], ArrayOperation.perform(b, input.slice(0)));
  assert.isArrayEqual(expected, output);

}

var ArrayOperationTest = function() {

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

    "Transformation: a=Delete, b=Delete (1,2), a < b and b < a", function() {
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

    "Transformation (conflict): a=Move, b=Insert, m.s > i && m.t == i", function() {
      var input = [1,3,4,5];
      var expected1 = [1,5,2,3,4];
      var expected2 = [1,2,5,3,4];
      var a = ArrayOperation.Move(3, 1);
      var b = ArrayOperation.Insert(1, 2);

      testTransform(a, b, input, expected1);
      testTransform(b, a, input, expected2);
    },

    "Transformation (conflict): a=Move, b=Insert, m.s < i && m.t == i-1", function() {
      var input = [1,2,3,5];
      var expected1 = [1,3,2,4,5];
      var expected2 = [1,3,4,2,5];
      var a = ArrayOperation.Move(1, 2);
      var b = ArrayOperation.Insert(3, 4);

      testTransform(a, b, input, expected1);
      testTransform(b, a, input, expected2);
    },

    "Transformation (conflict): a=Move, b=Delete, m.s == d", function() {
      var input = [1,2,3,4];
      var expected = [1,2,4];
      var a = ArrayOperation.Move(2, 0);
      var b = ArrayOperation.Delete(2, 3);

      testTransform(a, b, input, expected);
      testTransform(b, a, input, expected);
    },

    "Transformation (conflict): a=Move, b=Move, a.s == b.s", function() {
      var input = [1,2,3,4];
      var expected1 = [1,3,2,4];
      var expected2 = [2,1,3,4];
      var a = ArrayOperation.Move(1, 0);
      var b = ArrayOperation.Move(1, 2);

      testTransform(a, b, input, expected1);
      testTransform(b, a, input, expected2);
    },

    "Transformation (conflict): a=Move, b=Move, a.s < b.t && a.t == b.t-1", function() {
      var input = [1,2,3,4];
      var expected1 = [2,1,4,3];
      var expected2 = [2,4,1,3];
      var a = ArrayOperation.Move(0, 1);
      var b = ArrayOperation.Move(3, 2);

      testTransform(a, b, input, expected1);
      testTransform(b, a, input, expected2);
    },

    "Transformation (conflict): a=Move, b=Move, a.t == b.t", function() {
      var input = [1,2,3,4];
      var expected1 = [1,3,4,2];
      var expected2 = [1,4,3,2];
      var a = ArrayOperation.Move(2, 1);
      var b = ArrayOperation.Move(3, 1);

      testTransform(a, b, input, expected1);
      testTransform(b, a, input, expected2);
    },

    "Update: [1,2,3,4,5] -> [2,1,3,4]", function() {
      var input = [1,2,3,4,5];
      var expected = [2,1,3,4];

      var op = ArrayOperation.Update(input, expected);
      var output = op.apply(input);

      assert.isArrayEqual(expected, output);
    },

    "Update: [1,2,3,4,5] -> []", function() {
      var input = [1,2,3,4,5];
      var expected = [];

      var op = ArrayOperation.Update(input, expected);
      var output = op.apply(input);

      assert.isArrayEqual(expected, output);
    },

    "Update: [1,2,3,4,5] -> [5,4,3,2,1]", function() {
      var input = [1,2,3,4,5];
      var expected = [5,4,3,2,1];

      var op = ArrayOperation.Update(input, expected);
      var output = op.apply(input);

      assert.isArrayEqual(expected, output);
    },

    "Delete 3: [1,2,3,4,5] -> [1,2,4,5]", function() {
      var input = [1,2,3,4,5];
      var expected = [1,2,4,5];

      var op = ArrayOperation.Delete(input, 3);
      var output = op.apply(input);

      assert.isArrayEqual(expected, output);
    },

    "Pop: [1,2,3,4,5] -> [1,2,3,4]", function() {
      var input = [1,2,3,4,5];
      var expected = [1,2,3,4];

      var op = ArrayOperation.Pop(input);
      var output = op.apply(input);

      assert.isArrayEqual(expected, output);
    },

    "Push: [1,2,3,4] -> [1,2,3,4,6]", function() {
      var input = [1,2,3,4];
      var expected = [1,2,3,4,6];

      var op = ArrayOperation.Push(input, 6);
      var output = op.apply(input);

      assert.isArrayEqual(expected, output);
    }

  ];

};

registerTest(['Operator', 'Array Operation'], new ArrayOperationTest());
