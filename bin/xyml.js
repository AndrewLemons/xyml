#!/usr/bin/env node

"use strict";

const path = require("path");
const fs = require("fs");
const XYML = require("../src/index");

// Parse flags
let lastFlag = null;
let flags = {};
for (let i = 3; i < process.argv.length; i++) {
	if (process.argv[i].match(/-.*/)) {
		if (lastFlag) flags[lastFlag] = true;
		lastFlag = process.argv[i];
	} else {
		if (lastFlag) flags[lastFlag] = process.argv[i];
	}
}

// Parse input
let parser = new XYML({});
let result = JSON.stringify(
	parser.parseFile(path.resolve(process.env.PWD, process.argv[2]))
);

// Output result
if (typeof flags["-o"] === "string") {
	// Save to file
	fs.writeFileSync(path.resolve(process.env.PWD, flags["-o"]), result);
} else {
	// Log to console
	process.stdout.write(result);
}
