import { data } from '../src/data';
import { accountBalance } from '../src/analyze';
import { ledger } from '../src/parse';
const R = require('ramda');
const d3 = require('d3');
const c3 = require('c3');

const React = require('react');
const ReactDOM = require('react-dom');


// - FIXME: show everything in terms of dollars, get rid of sumQantities
const sumQuantities = R.compose(R.sum, R.values);
const columns = R.compose(
  R.map(p => [p[0], sumQuantities(p[1])]),
  accountBalance(/^Expenses/),
  R.prop('transactions'),
  ledger
)(data);

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
