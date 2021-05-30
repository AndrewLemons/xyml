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
		let obj = this.#createObject(tree);
		return this.#compressObject(obj);
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
					let value = undefined;
					try {
						value = JSON.parse(data.value);
					} catch {}

					return {
						indent: data.indent.length,
						isAttr: !!data.attribute,
						name: data.name,
						value,
						children: [],
					};
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

	/**
	 * Create an object from a tree.
	 * @param {object} tree - Tree to create the object from.
	 * @returns {object} The created object.
	 */
	#createObject(tree) {
		let result = {};

		if (tree.value !== undefined) {
			result[this.options.valueKey] = tree.value;

			tree.children.forEach((child) => {
				if (child.isAttr) {
					result[this.options.preAttr + child.name] = child.value ?? true;
				}

				if (child.name === "") result[this.options.valueKey] = child.value;
			});
		} else {
			tree.children.forEach((child) => {
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

	/**
	 * Compress an object.
	 * @param {object} target - Target object to compress.
	 * @returns {object} Compressed object.
	 */
	#compressObject(target) {
		// Compress children
		if (this.options.compressValues && this.options.compressArrays) {
			Object.keys(target).forEach((key) => {
				if (Array.isArray(target[key])) {
					// Compress the child object
					target[key] = target[key].map((value) => this.#compressObject(value));
				}
			});
		} else {
			return target; // Do not compress anything to save time
		}

		// Compress values
		if (this.options.compressValues) {
			let keys = Object.keys(target);

			// Ensure that the value is the only key
			if (keys.length === 1 && keys.includes(this.options.valueKey)) {
				// Set the target to that only key
				target = target[this.options.valueKey];
			}
		}

		// Compress arrays
		if (this.options.compressArrays) {
			if (typeof target === "object") {
				Object.keys(target).forEach((key) => {
					// Ensure the key is still any array
					if (!Array.isArray(target[key])) return;
					// If the array is one element long, compress it
					if (target[key].length === 1) target[key] = target[key][0];
				});
			}
		}

		return target;
	}

	static defaults = {
		valueKey: "#", // Key to use for values
		preAttr: "$", // String to prepend to attribute keys
		compressValues: true, // Compress value only tags to their value
		compressArrays: false, // Compress single item arrays to their single item
	};
}

module.exports = XYML;
