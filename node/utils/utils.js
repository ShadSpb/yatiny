const _ = require("lodash");

exports.toCamelCase = obj => _.mapKeys(obj, (v, k) => _.camelCase(k));
