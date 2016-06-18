const R = require('ramda');
const M = require('monet');

const search = R.invoker(1, 'search');
const substring2 = R.invoker(2, 'substring');
const substring1 = R.invoker(1, 'substring');
const twice = f => d => f(d)(d);
const lSplit = pat => twice(R.compose(substring2(0), search(pat)));
const rSplit = pat => twice(R.compose(substring1, R.add(1), search(pat)));
const escapeRe = s => s.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&');
const firstMatch = R.nth(1);
const trimMatch = R.compose(R.match, RegExp, s => `^[${s}]*(.*)`, escapeRe);

// a -> a (w/side effect)
export const trace = R.curry((tag, x) => {
  console.log(tag, x);
  return x;
});

export const applyIfTruthy = f => R.ifElse(R.identity, f, R.identity);

// Regexp -> int -> str -> [str]
export const splitN = R.curry(
  (pat, n, s) =>
    R.test(pat, s) && n > 0
      ? R.compose(
          R.prepend(lSplit(pat)(s)),
          splitN(pat, n-1),
          rSplit(pat)
        )(s)
      : [s]
);

// str -> str -> str
export const lTrim = chars => applyIfTruthy(R.compose(R.nth(1), trimMatch(chars)));
