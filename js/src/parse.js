Error.stackTraceLimit = Infinity;
const R = require('ramda');
const Decimal = require('decimal.js');
import { splitN, lTrim, trace, applyIfTruthy } from './util';

// helpers
const lines = R.split('\n');
const firstLine = R.compose(R.head, lines);
const transChunks = R.split(/\n{2,}/);
const transSection = R.compose(R.nth(4), splitN(/\n{2}/, 4));
const decimal = R.constructN(1, Decimal);

// parsing
const desc = R.compose(R.last, splitN(/ /, 1), firstLine);
const date = R.compose(R.constructN(1, Date), R.head, splitN(/ /, 1), firstLine);
const account = R.compose(R.trim, R.nth(1));
const prefixCommodity = R.applySpec({
  commodity: R.head, quantity: R.compose(decimal, R.tail)
});
const withUnitPrice = R.compose(
  R.applySpec({
    quantity: R.compose(decimal, R.nth(0)),
    commodity: R.nth(1),
    unitPrice: R.compose(prefixCommodity, R.nth(3))
  }),
  R.split(/ /)
);
const postfixCommodity = R.compose(
  R.applySpec({
    quantity: R.compose(decimal, R.nth(0)),
    commodity: R.nth(1),
  }),
  R.split(/ /)
);
const amount = R.compose(
  R.cond([
    [ R.test(/^-?\d.*@/), withUnitPrice ],
    [ R.test(/^-?\d/), postfixCommodity ],
    [ R.length, prefixCommodity ],
    [ R.T, a => {} ],
  ]),
  R.nth(2)
);
const posting = R.compose(R.applySpec({ account, amount }), splitN(/\s{2,}/, 2));
const postings = R.compose(R.map(posting), R.tail, lines);
export const transaction = R.compose(R.applySpec({ desc, date, postings }), R.trim);
const transactions = R.compose(R.map(transaction), transChunks);
export const ledger = R.compose(R.applySpec({ transactions }), transSection);
