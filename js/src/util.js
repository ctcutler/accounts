const R = require('ramda');
const M = require('monet');

// a -> a (w/side effect)
export const trace = R.curry((tag, x) => {
  console.log(tag, x);
  return x;
});

const search = R.invoker(1, 'search');
const substring = R.invoker(2, 'substring');
const substr = R.invoker(1, 'substr');
const lSubstr = i => substring(0, i);
const rSubstr = R.curry(
  (i, s) => R.compose(
    substr,
    R.subtract(i+1),
    R.length
  )(s)(s)
);
const lSplit = R.curry((pat, s) => R.compose(lSubstr, search(pat))(s)(s));
const rSplit = R.curry((pat, s) => R.compose(rSubstr, search(pat))(s)(s));
const escapeRe = s => s.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&');
const result = R.nth(1);
const capture = R.compose(R.match, RegExp, s => `^[${s}]*(.*)`, escapeRe);


export const applyIfTruthy = f => R.ifElse(R.identity, f, R.identity);

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
export const lTrim = chars => applyIfTruthy(R.compose(result, capture(chars)));
