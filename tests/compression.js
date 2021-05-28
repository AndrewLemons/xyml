const path = require("path");
const { inspect } = require("util");
const XYML = require("../src/index");

const parser = new XYML({
	compressArrays: true,
	compressValues: true,
});

console.log(
	inspect(parser.parseFile(path.join(__dirname, "../samples/message.xyml")), {
		depth: null,
	})
);
