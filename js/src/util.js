const R = require('ramda');

const search = R.curry((c, s) => s.search(c));
const lSubstr = R.curry((i, s) => s.substring(0, i));
const rSubstr = R.curry((i, s) => s.substr(-(s.length-(i+1))));
const lSplit = R.curry((pat, s) => R.compose(lSubstr, search(pat))(s)(s));
const rSplit = R.curry((pat, s) => R.compose(rSubstr, search(pat))(s)(s));

// Regexp -> int -> str -> [str]
export const splitN = R.curry(
  (pat, n, s) =>
    R.test(pat, s) && n > 0
      ? R.compose(
          R.prepend(lSplit(pat, s)),
          splitN(pat, n-1),
          rSplit(pat)
        )(s)
      : [s]
);
