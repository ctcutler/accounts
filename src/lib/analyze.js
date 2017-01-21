Error.stackTraceLimit = Infinity;
const R = require('ramda');
const moment = require('moment');
import { safeObjOf, multDecimal, addDecimal, invertDecimal,
  decimalIsZero, parseDecimal, mapAssoc, equalDates, logError } from './util';

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
const reduceTrans = (acc, v) => R.compose(
  R.mergeWith(mergeAmounts, acc),
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
// [transaction] -> [[account, {commodity: quantity}], ...]
export const balances = acctRE => R.compose(
  R.sortBy(R.nth(0)),
  R.filter(R.compose(R.test(acctRE), R.nth(0))),
  R.toPairs,
  removeZeroes,
  R.reduce(reduceTrans, {})
);

export const filterAccount = re => R.filter(
  R.compose(
    R.any(R.compose(R.test(re), R.prop('account'))),
    R.prop('postings')
  )
);
export const filterBefore = d => R.filter(R.compose(R.gt(d), R.prop('date')));
export const filterAfter = d => R.filter(R.compose(R.lt(d), R.prop('date')));
export const filterNoOp = R.filter(
  R.compose(
    R.lt(1),
    R.length,
    R.uniq,
    R.pluck('account'),
    R.prop('postings')
  )
);

export const sumQuantities = R.mergeWithKey((k, l, r) => k === 'quantity' ? addDecimal(l, r) : r);
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

const calculateConversion = R.ifElse(
  (prices, amount) => R.has(amount.commodity, prices),
  (prices, amount) => multDecimal(prices[amount.commodity].price, amount.quantity),
  (prices, amount) => logError('price not found for: '+amount.commodity, undefined)
);
const sameCommodity = comm => R.compose(R.equals(comm), R.prop('commodity'));
const newAmount = (commodity, prices) => R.applySpec({
  commodity: R.always(commodity), quantity: calculateConversion(prices)
})
export const convertTransactions = (commodity, prices) => mapAssoc(
  ['postings', 'amount'],
  R.unless(sameCommodity(commodity), newAmount(commodity, prices))
);

// give every transaction a numeric id
export const identifyTransactions = txns =>
  R.zipWith(R.assoc('id'), R.range(1, txns.length+1), txns);

const datedPostings = (floorDate, accountRE) => R.compose(
  R.flatten,
  R.map(
    trans => R.map(
      R.ifElse(
        R.compose(R.test(accountRE), R.prop('account')),
        posting => R.objOf(floorDate(trans.date), posting.amount.quantity),
        posting => ({})
      ),
      trans.postings
    )
  )
);

const overTime = floorDate => accountRE => R.compose(
  R.sortBy(R.nth(0)),
  R.map(R.adjust(R.constructN(1, Date), 0)),
  R.toPairs,
  R.reduce(R.mergeWith(addDecimal), {}),
  datedPostings(floorDate, accountRE)
);

const startOf = unit => d => moment(d).startOf(unit).toDate();

export const overDays = overTime(startOf('day'));
export const overWeeks = overTime(startOf('week'));
export const overMonths = overTime(startOf('month'));
export const overYears = overTime(startOf('year'));

const addOne = (unit, d) => moment(d).add(1, unit).toDate();
const shouldAddBefore = (unit, acc, v) =>
  R.length(acc) > 0 && addOne(unit, R.last(acc)[0]) < v[0];
const appendNew = (unit, acc) =>
  R.append([addOne(unit, R.last(acc)[0]), null], acc);
const addBefore = unit => (acc, v) =>
  shouldAddBefore(unit, acc, v)
  ? addBefore(unit)(appendNew(unit, acc), v)
  : R.append(v, acc);

const fillIn = unit => R.reduce(addBefore(unit), []);
export const fillInDays = fillIn('day');
export const fillInWeeks = fillIn('week');
export const fillInMonths = fillIn('month');
export const fillInYears = fillIn('year');

export const minTs = R.compose(
  R.reduce(R.min, Infinity),
  R.map(R.path(['0', '0']))
);
export const maxTs = R.compose(
  R.reduce(R.max, 0),
  R.map(R.compose(R.nth(0), R.last))
);
export const prependMin = series => s =>
  equalDates(s[0][0], minTs(series))
    ? s
    : R.prepend([minTs(series), null], s);
export const appendMax = series => s =>
  equalDates(R.last(s)[0], maxTs(series))
    ? s
    : R.append([maxTs(series), null], s);

/* normalize series date ranges to the widest possible range */
export const normalizeMax = unit => series => R.compose(
  R.map(fillIn(unit)),
  R.map(prependMin(series)),
  R.map(appendMax(series))
)(series);

const mostRecent = acc => acc.length > 0 ? R.nth(-1, acc)[1] : parseDecimal(0);
const newDataPoint = (acc, v) => [v[0], addDecimal(v[1], mostRecent(acc))];
const runTotal = (acc, v) => R.append(newDataPoint(acc, v), acc);
// takes sorted list of deltas by date, returns list of running totals by date
export const runningTotal = R.reduce(runTotal, []);
