const R = require('ramda');
const M = require('monet');

// a -> a (w/side effect)
export const trace = R.curry((tag, x) => {
  console.log(tag, x);
  return x;
});

const search = R.curry((c, s) => s.search(c));
const lSubstr = R.curry((i, s) => s.substring(0, i));
const rSubstr = R.curry((i, s) => s.substr(-(s.length-(i+1))));
const lSplit = R.curry((pat, s) => R.compose(lSubstr, search(pat))(s)(s));
const rSplit = R.curry((pat, s) => R.compose(rSubstr, search(pat))(s)(s));
const re = s => new RegExp(s);
const escapeRe = s => s.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&');
const result = R.nth(1);
const capture = R.compose(R.match, re, s => `^[${s}]*(.*)`, escapeRe);

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

// str -> str -> str
export const lTrim = chars => R.ifElse(
  R.identity,
  R.compose(result, capture(chars)),
  R.identity
);
