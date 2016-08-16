Error.stackTraceLimit = Infinity;
const R = require('ramda');
import { trace, safeObjOf, safeAssoc, multDecimal, addDecimal, invertDecimal,
  decimalIsZero } from './util';

export const mergeAmounts = R.mergeWith(addDecimal);
export const unitQuantity = R.path(['unitPrice', 'quantity']);
export const unitCommodity = R.path(['unitPrice', 'commodity']);
export const amount = R.compose(
  amt => R.merge(
    safeObjOf(amt.commodity, amt.quantity),
    safeObjOf(
      unitCommodity(amt),
      R.reduce(multDecimal, -1, [unitQuantity(amt), amt.quantity])
    )
  ),
  R.prop('amount')
);
export const reducePosting = (acc, p) => R.mergeWith(
  mergeAmounts, R.objOf(p['account'], amount(p)), acc
);
const invertValues = R.map(invertDecimal);
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
export const removeZeroes = R.map(R.filter(R.compose(R.not, decimalIsZero)));
// [transaction] -> {account: {commodity: quantity}}
export const balanceMap = R.compose(removeZeroes, R.reduce(reduceTrans, {}));
export const balance = R.compose(R.toPairs, balanceMap);
export const filterAccount = re => R.filter(R.compose(R.test(re), R.nth(0)));
// pattern string -> [transaction] -> [[account, {commodity: quantity}]]
export const accountBalance = pat => R.compose(filterAccount(pat), balance);
