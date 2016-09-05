Error.stackTraceLimit = Infinity;
const R = require('ramda');
import { trace, safeObjOf, safeAssoc, multDecimal, addDecimal, invertDecimal,
  decimalIsZero, parseDecimal, mapAssoc } from './util';

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
export const balancePostingsOld = mapping => safeAssoc(
  emptyKey(mapping),
  balancedAmount(mapping),
  mapping
);
const reduceTrans = (acc, v) => R.compose(
  R.mergeWith(mergeAmounts, acc),
  balancePostingsOld,
  R.reduce(reducePosting, {}), // make account -> {commodity -> quantity} mapping
  R.prop('postings')
)(v);

// {'foo': {'$': 12.43}, 'bar': {'$': 0}} -> {'foo': {'$': 12.43}}
export const removeZeroes = R.filter(
  R.compose(
    R.any(R.identity),
    R.values,
    R.map(R.compose(R.not, decimalIsZero))
  )
);
// [transaction] -> {account: {commodity: quantity}}
export const balanceMap = R.compose(removeZeroes, R.reduce(reduceTrans, {}));
export const filterAccount = re => R.filter(R.compose(R.test(re), R.nth(0)));
export const balance = R.compose(R.toPairs, balanceMap);

export const filterBefore = d => R.filter(R.compose(R.gt(d), R.prop('date')));
export const filterAfter = d => R.filter(R.compose(R.lt(d), R.prop('date')));

export const sumQuantities = R.mergeWithKey((k, l, r) => k == 'quantity' ? addDecimal(l, r) : r);
const getAmounts = R.compose(R.map(R.prop('amount')), R.init);
export const balanceAmounts = R.compose(
  amount => R.assoc('quantity', invertDecimal(amount.quantity), amount),
  R.reduce(sumQuantities, {quantity: parseDecimal(0), commodity: ''}),
  getAmounts
);
const balanceLast = postings => R.assoc('amount', balanceAmounts(postings), R.last(postings));
export const balancePostings = postings => R.append(balanceLast(postings), R.init(postings));
const balanceTransaction = trans => R.assoc('postings', balancePostings(trans.postings), trans);
export const balanceTransactions = R.map(balanceTransaction);

// FIXME: should commodity prices structure be the following?
//{ fromcommodity: { tocommodity: [{date: Date(), price: Decimal()}]}}
// FIXME: try first look up the price for everything, then doing the conversion
const calculateConversionOld = R.ifElse(
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

/* takes commodity to convert to, price mapping, list of [account, amount mapping] pairs;
   updates the amount mappings to the requested commodity or sets them to undefined */
export const convertCommodities = commodity => prices => R.map(
  R.adjust(
    R.compose(
      R.reduce((acc, val) => R.mergeWith(addDecimal, acc, R.objOf(val[0], val[1])), {}),
      R.map(convertCommodity(prices, commodity)),
      R.toPairs
    ),
    1
  )
);
export const toDollars = convertCommodities('$');
const calculateConversion = R.ifElse(
  (prices, amount) => R.has(amount.commodity, prices),
  (prices, amount) => multDecimal(prices[amount.commodity].price, amount.quantity),
  (prices, amount) => undefined
);
const sameCommodity = comm => R.compose(R.equals(comm), R.prop('commodity'));
const newAmount = (commodity, prices) => R.applySpec({
  commodity: R.always(commodity), quantity: calculateConversion(prices)
})
export const convertTransactions = commodity => prices => mapAssoc(
  ['postings', 'amount'],
  R.unless(sameCommodity(commodity), newAmount(commodity, prices))
);
