import { data } from './data';
import { balance, toDollars, filterAccount, filterBefore, filterAfter,
  balanceTransactions, convertTransactions, overMonths, overDays
} from './analyze';
import { ledger } from './parse';
import { trace } from './util';
const R = require('ramda');
const d3 = require('d3');
const c3 = require('c3');

const React = require('react');
const ReactDOM = require('react-dom');

const ledgerData = ledger(data);
const columns = R.compose(
  R.map(R.adjust(R.prop('$'), 1)),
  filterAccount(/^Assets/),
  balance,
  convertTransactions('$', ledgerData['commodityPrices']),
  balanceTransactions,
  filterBefore(new Date('2016/03/01')),
  filterAfter(new Date('2016/01/01')),
  R.prop('transactions')
)(ledgerData);
const timeSeries = R.compose(
  pairs => [R.pluck(0, pairs), R.pluck(1, pairs)],
  R.prepend(['x', 'data1']),
  overDays(/^Assets/),
  convertTransactions('$', ledgerData['commodityPrices']),
  balanceTransactions,
  filterBefore(new Date('2016/03/01')),
  filterAfter(new Date('2016/01/01')),
  R.prop('transactions')
)(ledgerData);

const main = <div>
  <div id="pieChart"></div>
  <div id="timeSeriesChart"></div>
</div>;

ReactDOM.render(
  main,
  document.getElementById('example')
);

const pieChart = c3.generate({
    bindto: '#pieChart',
    size: {
      height: 700
    },
    data: {
      type: 'pie',
      columns
    }
});
const timeSeriesChart = c3.generate({
    bindto: '#timeSeriesChart',
    data: {
        x: 'x',
        columns: timeSeries
    },
    axis: {
        x: {
            type: 'timeseries',
        }
    }
});
