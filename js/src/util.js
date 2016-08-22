const R = require('ramda');
const Decimal = require('decimal.js');

// Debugging
export const trace = R.curry((tag, x) => {
  console.log(tag, JSON.stringify(x));
  return x;
});

// Numbers
export const parseDecimal = R.constructN(1, Decimal);
export const addDecimal = R.ifElse(
  (x, y) => R.or(R.isNil(x), R.isNil(y)),
  (x, y) => undefined,
  (x, y) => parseDecimal(x).plus(parseDecimal(y))
);
export const multDecimal = R.ifElse(
  (x, y) => R.or(R.isNil(x), R.isNil(y)),
  (x, y) => undefined,
  (x, y) => parseDecimal(x).times(parseDecimal(y))
);
export const invertDecimal = R.ifElse(
  R.isNil, R.identity, x => multDecimal(-1, x)
);
export const decimalIsZero = R.invoker(0, 'isZero');

// Strings
const matchOffset = m => m.index + m[0].length;
const lSplit = pat => s => s.substring(0, s.search(pat));
const rSplit = pat => s => s.substring(matchOffset(s.match(pat)));
const splitMore = (pat, n, s) => R.test(pat, s) && n > 0;
const prependLeft = (pat, s) => R.prepend(lSplit(pat)(s));
const recurseRight = (pat, n) => R.compose(splitN(pat, n-1), rSplit(pat));
const recurse = (pat, n, s) => R.compose(prependLeft(pat, s), recurseRight(pat, n))(s);
const baseCase = R.compose(Array, R.nthArg(2));
const escapeRe = s => s.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&');
const trimMatch = R.compose(R.match, RegExp, s => `^[${s}]*(.*)`, escapeRe);
export const splitN = R.ifElse(splitMore, recurse, baseCase);
export const lTrim = chars => applyIfTruthy(R.compose(R.nth(1), trimMatch(chars)));

// Objects
const makePaths = R.ifElse(
  R.curry((path, v) => R.is(Object, v) && !R.isEmpty(v)),
  R.curry((path, v) => R.compose(
    R.map(k => makePaths(R.append(k, path), v[k])),
    R.keys
  )(v)),
  R.curry((path, v) => R.objOf(R.join(':', path), v))
);
export const safeObjOf = R.ifElse(
  (k, v) => k === undefined,
  (k, v) => ({}),
  (k, v) => R.objOf(k, v)
);
export const safeAssoc = R.ifElse(
  (k, v, o) => k === undefined,
  (k, v, o) => o,
  (k, v, o) => R.assoc(k, v, o)
);
// flattens nested objects into a shallow object with ':'-separated paths for keys
// {a: {b: 1}} -> {"a:b": 1}
export const flattenToPaths = R.compose(
  R.reduce(R.merge, {}),
  R.flatten,
  makePaths([])
);

// Logic
export const applyIfTruthy = f => R.ifElse(R.identity, f, R.identity);
