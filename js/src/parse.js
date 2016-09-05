Error.stackTraceLimit = Infinity;
const R = require('ramda');
import { splitN, trace, parseDecimal } from './util';

// helpers
const lines = R.split('\n');
const firstLine = R.compose(R.head, lines);
const transChunks = R.split(/\n{2,}/);
const cpSection = R.compose(R.nth(2), splitN(/\n{2}/, 4));
const transSection = R.compose(R.nth(4), splitN(/\n{2}/, 4));

// parsing
const desc = R.compose(R.last, splitN(/ /, 1), firstLine);
const date = R.compose(R.constructN(1, Date), R.head, splitN(/ /, 1), firstLine);
const account = R.compose(R.trim, R.nth(1));
const prefixCommodity = R.applySpec({
  commodity: R.head, quantity: R.compose(parseDecimal, R.tail)
});
const withUnitPrice = R.compose(
  R.applySpec({
    quantity: R.compose(parseDecimal, R.nth(0)),
    commodity: R.nth(1),
    unitPrice: R.compose(prefixCommodity, R.nth(3))
  }),
  R.split(/ /)
);
const postfixCommodity = R.compose(
  R.applySpec({
    quantity: R.compose(parseDecimal, R.nth(0)),
    commodity: R.nth(1),
  }),
  R.split(/ /)
);
const amount = R.compose(
  R.cond([
    [ R.test(/^-?\d.*@/), withUnitPrice ],
    [ R.test(/^-?\d/), postfixCommodity ],
    [ R.length, prefixCommodity ],
    [ R.T, a => ({}) ],
  ]),
  R.nth(2)
);
const posting = R.compose(R.applySpec({ account, amount }), splitN(/\s{2,}/, 2));
export const postings = R.compose(R.map(posting), R.tail, lines);

/* "2014/02/14 foo bar
 *    Assets:Some Account:Sub-Account    $288.10558392
 *    Assets:Some Account:Another Sub-Account   -0.0070 VEXAX @ $62.2100
 *    Income:Some Other Account"
 * ->
 * {
 *   date: Date('2014/02/14'),
 *   desc: 'foo bar',
 *   postings: [
 *     {
 *       account: 'Assets:Some Account:Sub-Account',
 *       amount: {quantity: Decimal(288.10558392), commodity: '$'}
 *     },
 *     {
 *       account: 'Assets:Some Account:Another Sub-Account',
 *       amount: {quantity: Decimal(-0.0070), commodity: 'VEXAX'},
 *       unitPrice: {quantity: Decimal(62.2100), commodity: '$'}
 *     },
 *     {
 *       account: 'Assets:Some Account:Sub-Account',
 *       amount: {}
 *     },
 *   ]
 * }
 */
export const transaction = R.compose(
  R.applySpec({ desc, date, postings }),
  R.trim
);
const transactions = R.compose(R.map(transaction), transChunks, transSection);
const cpDate = R.compose(R.constructN(1, Date), R.nth(1));
const cpPrice = R.compose(parseDecimal, R.tail, R.nth(4));
const cpUnit = R.compose(R.head, R.nth(4));
const cpObj = R.applySpec({date: cpDate, unit: cpUnit, price: cpPrice});
const commodityPrice = R.compose(
  R.apply(R.objOf),
  R.juxt([R.nth(3), cpObj]),
  splitN(/ /, 4)
);
const reduceCP = (acc, val) => R.merge(acc, commodityPrice(val));

/* "P 2016/04/24 00:00:00 MWTRX $10.82"
 * ->
 * {'MWTRX': {date: Date('2016/04/24'), unit: '$', price: Decimal('10.82')}} */
export const commodityPrices = R.compose(R.reduce(reduceCP, {}), lines, cpSection);
export const ledger = R.applySpec({ transactions, commodityPrices });
