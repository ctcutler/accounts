const fp = require('lodash/fp');

const flatMapNoCap = fp.flatMap.convert({ 'cap': false });
const match = c => s => s.match(c);
const substring = x => y => s => s.substring(x, y);
const search = c => s => s.search(c);
const splitLeft = c => s => substring(0)(search(c)(s))(s);
const splitRight = c => s => substring(
  search(c)(s) + match(c)(s)[0].length
)(s.length)(s);
const splitOnce = c => s => [splitLeft(c)(s), splitRight(c)(s)]

export const splitN = splitOn => maxSplits => s =>
  maxSplits > 0 && match(splitOn)(s)
    ? flatMapNoCap(
        (v, i) => i === 0 ? v : splitN(splitOn)(maxSplits-1)(v)
      )(splitOnce(splitOn)(s))
    : [s];

export const trace = tag => x => {
  console.log(tag, x);
  return x;
}

