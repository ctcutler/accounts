import React from 'react';
const c3 = require('c3');
const R = require('ramda');
import { overMonths, balances, normalizeMax } from '../lib/analyze';
import { invertDecimal } from '../lib/util';

class Income extends React.Component {
  constructor(props) {
    super(props);
    this.chart = null;
  }

  _renderChart(transactions) {
    if (!transactions || transactions.length === 0) return;

    const accountRE = /^Income/;
    // FIXME: clean up and abstract all this
    const accounts = R.compose(
      R.pluck(0),
      balances(accountRE)
    )(transactions);
    const series = R.compose(
      normalizeMax('month'),
      R.map(
        acct => R.map(
          R.adjust(invertDecimal, 1),
          overMonths(new RegExp(acct))(transactions)
        )
      )
    )(accounts);
    const mapIndexed = R.addIndex(R.map);
    const columns = R.compose(
      R.prepend(
        R.compose(
          R.prepend('x'),
          R.pluck(0)
        )(series[0])
      ),
      mapIndexed(
        (s, idx) => R.compose(
          R.prepend(accounts[idx]),
          R.map(R.when(R.equals(null), R.always(0))),
          R.pluck(1)
        )(s)
      )
    )(series);
    const types = R.reduce((acc, acct) => R.assoc(acct, 'area', acc), {}, accounts);
    const groups = [accounts];
    const data = { x: 'x', columns, types, groups };
    if (this.chart === null) {
      c3.generate({
        bindto: '#incomeChart',
        data,
        size: {
          height: 700
        },
        axis: {
          x: {
            type: 'timeseries',
          }
        },
        tooltip: {
          format: {
            // from: http://stackoverflow.com/questions/149055/how-can-i-format-numbers-as-money-in-javascript
            value: (value, ratio, id, index) =>
              id === 'savingRate'
                ? ((value / columns[1][index+1]) * 100).toFixed(2).toString() + '%'
                : value.toFixed(2).replace(/(\d)(?=(\d{3})+\.)/g, '$1,')
          }
        },
        point: {
          show: false
        }
      });
    } else {
      this.chart.load(data);
    }
  }

  componentDidMount() {
    this._renderChart(this.props.transactions);
  }

  componentDidUpdate() {
    this._renderChart(this.props.transactions);
  }

  render() {
      return <div id="incomeChart"></div>;
  }
}

export default Income;
