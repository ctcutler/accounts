Error.stackTraceLimit = Infinity;
const R = require('ramda');
import { trace, safeObjOf, safeAssoc } from './util';

export const mergeAmounts = R.mergeWith(R.add);
export const amount = R.compose(
  amt => R.merge(
    safeObjOf(amt.commodity, amt.quantity),
    safeObjOf(
      R.path(['unitPrice', 'commodity'], amt),
      R.path(['unitPrice', 'quantity'], amt) * amt.quantity * -1
    )
  ),
  R.prop('amount')
);
export const reducePosting = (acc, p) => R.mergeWith(
  mergeAmounts, R.objOf(p['account'], amount(p)), acc
);
const invertValues = R.map(R.multiply(-1));
export const balancedAmount = R.compose(
  R.reduce(mergeAmounts, {}),
  R.map(invertValues),
  R.values,
  R.filter(R.compose(R.not, R.isEmpty))
);
export const emptyKey = R.compose(R.head, R.keys, R.filter(R.isEmpty));
export const balancePostings = mapping => safeAssoc(
  emptyKey(mapping),
  balancedAmount(mapping),
  mapping
);
const isExchange = R.compose(R.equals(1), R.length, R.keys);
const reduceTrans = (acc, v) => R.compose(
  R.mergeWith(mergeAmounts, acc),
  balancePostings,
  R.reduce(reducePosting, {}), // make account -> {commodity -> quantity} mapping
  R.prop('postings')
)(v);
export const balance = R.reduce(reduceTrans, {});
