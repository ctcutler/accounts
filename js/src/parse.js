var fp = require('lodash/fp');
import { splitN, trace } from './util';

export const parseTransaction = input => {
  let lines = fp.split('\n')(input);
  let [date, desc] = fp.compose(
    splitN(/ /)(1),
    fp.head
  )(lines);

  let postings = fp.compose(
    fp.map(parts => ({ 'name': parts[1], 'quantity': parts[2] })),
    fp.map(splitN(/\s{2,}/)(2)),
    fp.tail
  )(lines);

  return {
    desc,
    date: new Date(date),
    postings,
  };
}
