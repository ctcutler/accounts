const R = require('ramda');
const Decimal = require('decimal.js');
import { splitN, lTrim, trace, applyIfTruthy } from './util';

const lines = R.split('\n');
const firstLine = R.compose(R.head, lines);
const safeDecimal = applyIfTruthy(Decimal);
const desc = R.compose(R.last, splitN(/ /, 1), firstLine);
const date = R.compose(R.constructN(1, Date), R.head, splitN(/ /, 1), firstLine);
const name = R.compose(R.trim, R.nth(1));
const quantity = R.compose(safeDecimal, lTrim('$ '), R.nth(2));
const posting = R.compose(R.applySpec({ name, quantity }), splitN(/\s{2,}/, 2));
const postings = R.compose(R.map(posting), R.tail, lines);
export const parseTransaction = R.applySpec({ desc, date, postings });
