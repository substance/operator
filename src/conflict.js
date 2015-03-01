function Conflict(a, b) {
  var conflict = new Error("Conflict: " + JSON.stringify(a) +" vs " + JSON.stringify(b));
  conflict.a = a;
  conflict.b = b;
}
Conflict.prototype = Error.prototype;

module.exports = Conflict;
