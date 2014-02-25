#!/usr/bin/env node

var lib = require('../lib');

/////////////
// main
lib.commander(function (err, res) {
    process.exit(err);
});
