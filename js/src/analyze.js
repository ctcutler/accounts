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

// FIXME: should commodity prices structure be the following?
//{ fromcommodity: { tocommodity: [{date: Date(), price: Decimal()}]}}
// FIXME: try first look up the price for everything, then doing the conversion
const calculateConversion = R.ifElse(
  (prices, pair) => R.has(pair[0], prices),
  (prices, pair) => multDecimal(prices[pair[0]].price, pair[1]),
  (prices, pair) => undefined
);
const convertCommodity = (prices, commodity) => R.unless(
  R.compose(R.equals(commodity), R.nth(0)),
  R.ifElse(
    pair => R.has(pair[0], prices),
    pair => [commodity, multDecimal(prices[pair[0]].price, pair[1])],
    pair => [pair[0], undefined]
  )
);
/* FIXME: need better comment */
export const convertCommodities = (prices, commodity) => R.map(
  R.adjust(
    R.compose(
      R.reduce((acc, val) => R.mergeWith(addDecimal, acc, R.objOf(val[0], val[1])), {}),
      R.map(convertCommodity(prices, commodity)),
      R.toPairs
    ),
    1
  )
);
export const toDollars = prices => convertCommodities(prices, '$');
