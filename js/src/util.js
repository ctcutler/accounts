const R = require('ramda');

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

// a -> a (w/side effect)
export const trace = R.curry((tag, x) => {
  console.log(tag, x);
  return x;
});

export const applyIfTruthy = f => R.ifElse(R.identity, f, R.identity);

// Regexp -> int -> str -> [str]
export const splitN = R.ifElse(splitMore, recurse, baseCase);

// str -> str -> str
export const lTrim = chars => applyIfTruthy(R.compose(R.nth(1), trimMatch(chars)));
