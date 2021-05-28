const fs = require("fs");
const { last } = require("./utils");

class XYML {
	/**
	 * Create a new XYML parser.
	 * @param {object} options - Options for how the parser will behave.
	 */
	constructor(options) {
		this.options = Object.assign(this.constructor.defaults, options);
	}

	/**
	 * Parse a XYML string.
	 * @param {string} src - Source containing the XYML.
	 * @returns {object} Parsed XYML object.
	 */
	parse(src) {
		let lines = this.#getLines(src);
		let tree = this.#createTree(lines);
		return this.#createObject(tree);
	}

	/**
	 * Parse a XYML file.
	 * @param {*} path - Path of the XYML file to be parsed.
	 * @param {*} options - Options for the parser.
	 * @returns {object} Parsed XYML object.
	 */
	parseFile(path, options = {}) {
		let file = fs.readFileSync(path, options.encoding ?? "utf-8");
		return this.parse(file, options);
	}

	#getLines(src) {
		return (
			src
				// Split the source into lines
				.split(/[\n\r]+/)
				// Divide each line into its components
				.map((line) => {
					let data =
						/(?<indent>\t*)((?<attribute>\+?(?: ?))(?<name>\w+): ?)?(?<value>.*)/.exec(
							line
						)?.groups;
					if (data === undefined) throw new Error("invalid line");
					return data;
				})
				// Convert the line data into an easier to work with format
				.map((data) => {
					let value = undefined
					try { value = JSON.parse(data.value) } catch {}

					return {
						indent: data.indent.length,
						isAttr: !!data.attribute,
						name: data.name,
						value,
						children: [],
					}
				})
		);
	}

	#createTree(lines) {
		let tree = { name: "root", indent: -1, children: [] };
		let stack = [tree];

		lines.forEach((line) => {
			let diff = line.indent - last(stack).indent;

			switch (diff) {
				case 0:
					stack.pop();
					last(stack).children.push(line);
					break;
				case 1:
					last(stack).children.push(line);
					break;
				default:
					if (diff < 0) {
						while (last(stack).indent + 1 > line.indent) {
							stack.pop();
						}
						last(stack).children.push(line);
					} else {
						throw new Error("invalid indentation");
					}
			}

			stack.push(line);
		});

		return tree;
	}

	#createObject(from) {
		let result = {};

		if (from.value !== undefined) {
			if (from.children.length === 0 && this.options.summarizeValues) {
				result = from.value;
			} else {
				result[this.options.valueKey] = from.value;

				from.children.forEach((child) => {
					if (child.isAttr) {
						result[this.options.preAttr + child.name] = child.value ?? true;
					}

					if (child.name === "") result[this.options.valueKey] = child.value;
				});
			}
		} else {
			from.children.forEach((child) => {
				if (child.isAttr) {
					result[this.options.preAttr + child.name] = child.value ?? true;
				} else {
					if (result[child.name] === undefined) result[child.name] = [];
					result[child.name].push(this.#createObject(child));
				}
			});
		}

		return result;
	}

	static defaults = {
		valueKey: "#", // Key to use for values
		preAttr: "$", // String to prepend to attribute keys
		summarizeValues: true, // Summarize value only tags to their value
	};
}

module.exports = XYML;
