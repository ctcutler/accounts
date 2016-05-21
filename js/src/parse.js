var fp = require('lodash/fp');
import { splitN } from './util';

export const parseTransaction = input => {
  let [date, desc] = fp.flow(
    fp.split('\n'),
    fp.first,
    splitN(' ', 1)
  )(input);

  return {
    desc,
    date: new Date(date),
  };
}
