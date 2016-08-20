import { data } from './data';
import { accountBalance, toDollars } from './analyze';
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
  toDollars(ledgerData['commodityPrices']),
  accountBalance(/^Assets/),
  R.prop('transactions')
)(ledgerData);

const main = <div>
  <div id="chart"></div>
</div>;

ReactDOM.render(
  main,
  document.getElementById('example')
);

const chart = c3.generate({
    bindto: '#chart',
    size: {
      height: 700
    },
    data: {
      type: 'pie',
      columns
    }
});
