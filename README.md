# XYML

XYML is a simple markup language based off of XML and YAML. It features the simplicity of YAML with the extensibility of XML.

## Notes

For the most part, XYML is most closely related to YAML. The few major differences that need to be noted are:

### Values are JSON

All values are parsed as if they were JSON. So, for example `"value"` is a string, and `0` is a number. This means that `"0"` is a string.

### Attributes have `+`

Attributes of values are noted by there prepended `+`. Attributes can be added to any value, simple (string, number, boolean) or complex (objects).

Take for example the complex value `parent` with child `foo` and attribute `baz`:

```XYML
parent:
	foo: "bar"
	+ baz: "fiz"
```

and the simple value `parent` with attribute `bar`:

```XYML
parent: "foo"
	+ bar: "baz"
```

### Arrays are multiple keys

Instead of creating an array using `-`, arrays are created by using multiple of the same keys.

For example, the YAML

```YAML
array:
  - bar
  - foo
```

would become

```XYML
array:
	item: "foo"
	item: "bar"
```

### Indention with tabs

All indention is done with a single tab instead of two spaces.
