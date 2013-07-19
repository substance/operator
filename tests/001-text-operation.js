"use strict";

var Test = require('substance-test');
var assert = Test.assert;
var registerTest = Test.registerTest;

var TextOperation = require("../index").TextOperation;

function testTransform(a, b, input, expected) {

  var t = TextOperation.transform(a, b);

  var s = t[1].apply(a.apply(input));
  assert.isEqual(expected, s);

  s = t[0].apply(b.apply(input));
  assert.isEqual(expected, s);

}

var TextOperationTest = function() {

  this.actions = [

    "Apply: Insert char at the string end", function() {
      var input = "Lorem ipsum";
      var expected = "Lorem ipsum.";
      var a = TextOperation.Insert(11, ".");
      assert.isEqual(expected, a.apply(input));
    },


    "Transformation: a=Insert, b=Insert, a before b", function() {

      var input = "Lorem ipsum";
      var expected = "Lorem bla ipsum blupp";
      var a = TextOperation.Insert(6, "bla ");
      var b = TextOperation.Insert(11, " blupp");

      // transformation should be symmetric in this case
      testTransform(a, b, input, expected);
      testTransform(b, a, input, expected);
    },

    "Transformation: a=Insert, b=Insert, same position", function() {
      // a before b
      var input = "Lorem ipsum";
      var expected = "Lorem bla blupp ipsum";
      var expected_2 = "Lorem blupp bla ipsum";
      var a = TextOperation.Insert(6, "bla ");
      var b = TextOperation.Insert(6, "blupp ");

      testTransform(a, b, input, expected);
      testTransform(b, a, input, expected_2);
    },

    "Transformation: a=Delete, b=Delete, a before b, no overlap", function() {

      var input = "Lorem ipsum dolor sit amet";
      var expected = "Lorem dolor amet";
      var a = TextOperation.Delete(6, "ipsum ");
      var b = TextOperation.Delete(18, "sit ");

      testTransform(a, b, input, expected);
      testTransform(b, a, input, expected);
    },

    "Transformation: a=Delete, b=Delete, with overlap", function() {

      var input = "Lorem ipsum dolor sit amet";
      var expected = "Lorem amet";
      var a = TextOperation.Delete(6, "ipsum dolor sit ");
      var b = TextOperation.Delete(12, "dolor ");

      testTransform(a, b, input, expected);
      testTransform(b, a, input, expected);
    },

    "Transformation: a=Delete, b=Delete, same position", function() {

      var input = "Lorem ipsum dolor sit amet";
      var expected = "Lorem amet";
      var a = TextOperation.Delete(6, "ipsum dolor ");
      var b = TextOperation.Delete(6, "ipsum dolor sit ");

      testTransform(a, b, input, expected);
      testTransform(b, a, input, expected);

    },

    "Transformation: a=Insert, b=Delete, a before b", function() {

      var input = "Lorem dolor sit amet";
      var expected = "Lorem ipsum dolor amet";
      var a = TextOperation.Insert(6, "ipsum ");
      var b = TextOperation.Delete(12, "sit ");

      testTransform(a, b, input, expected);
      testTransform(b, a, input, expected);

    },

    "Transformation: a=Insert, b=Delete, overlap", function() {

      var input = "Lorem dolor sit amet";
      var expected = "Lorem amet";
      var a = TextOperation.Insert(12, "ipsum ");
      var b = TextOperation.Delete(6, "dolor sit ");

      testTransform(a, b, input, expected);
      testTransform(b, a, input, expected);
    },

    "Compound: 'bla' - 'blapp' | 'blupp'", function() {
      var input = "bla";
      var expected1 = "blappupp";
      var expected2 = "bluppapp";
      var a = TextOperation.fromOT("bla", [2, -1, "app"]);
      var b = TextOperation.fromOT("bla", [2, -1, "upp"]);

      testTransform(a, b, input, expected1);
      testTransform(b, a, input, expected2);
    },

  ];

};

registerTest(['Operator', 'Text Operation'], new TextOperationTest());
