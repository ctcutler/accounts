const R = require('ramda');
const Decimal = require('decimal.js');
import { splitN, lTrim, trace, applyIfTruthy } from './util';

export const parseTransaction = input => {
  let lines = R.split('\n')(input);
  let [date, desc] = R.compose(splitN(/ /, 1), R.head)(lines);


  const safeDecimal = applyIfTruthy(Decimal);

  let postings = R.compose(
    R.map(
      R.compose(
        parts => ({
          'name': R.trim(parts[1]),
          'quantity': safeDecimal(lTrim('$ ')(parts[2]))
        }),
        splitN(/\s{2,}/, 2)
      )
    ),
    R.tail
  )(lines);

  return {
    desc,
    date: new Date(date),
    postings,
  };
}
