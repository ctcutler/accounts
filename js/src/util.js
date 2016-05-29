const fp = require('lodash/fp');

const flatMapNoCap = fp.flatMap.convert({ 'cap': false });
const includes = c => s => s.includes(c);
const substring = x => y => s => s.substring(x, y);
const indexOf = c => s => s.indexOf(c);
const splitLeft = c => s => substring(0)(indexOf(c)(s))(s);
const splitRight = c => s => substring(indexOf(c)(s)+1)(s.length)(s);
const splitOnce = c => s => [splitLeft(c)(s), splitRight(c)(s)]

export const splitN = splitOn => maxSplits => s =>
  maxSplits > 0 && includes(splitOn)(s)
    ? flatMapNoCap(
        (v, i, arr) => i === 0 ? v : splitN(splitOn)(maxSplits-1)(v)
      )(splitOnce(splitOn)(s))
    : [s];

export const trace = tag => x => {
  console.log(tag, x);
  return x;
}

