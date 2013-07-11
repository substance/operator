var MochaTestRunner = require("substance-test").MochaTestRunner;

require('./001-text-operation');
require('./002-array-operation');
require('./003-object-operation');

new MochaTestRunner().run();

