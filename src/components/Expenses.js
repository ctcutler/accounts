import React from 'react';
const c3 = require('c3');
const R = require('ramda');
import { overMonths, balances, normalizeMax } from '../lib/analyze';
import { invertDecimal } from '../lib/util';

class Expenses extends React.Component {
  constructor(props) {
    super(props);
    this.chart = null;
  }

  _renderChart(transactions) {
    if (!transactions || transactions.length === 0) return;

    // FIXME: rename this chart MultiSeriesOverTime (or something) and make
    // these three things props
    const accountRE = /^Expenses/;
    const limit = 10;
    const invert = false;
    // FIXME: clean up and abstract all this
    const accounts = R.compose(
      R.pluck(0),
      balances(accountRE)
    )(transactions);
    const series = R.compose(
      normalizeMax('month'),
      R.map(
        acct => R.map(
          s => invert ? R.adjust(invertDecimal, 1, s) : s,
          overMonths(new RegExp(acct))(transactions)
        )
      )
    )(accounts);
    const mapIndexed = R.addIndex(R.map);

    // FIXME is this really what "fold" is?
    const otherLabel = 'Others';
    const fold = f => l => R.reduce(f, R.head(l), R.tail(l));
    const prep = limit => R.compose(R.map(R.tail), R.drop(limit));
    const combine = limit => R.compose(fold(R.zipWith(R.add)), prep(limit));
    const others = limit => R.compose(R.prepend(otherLabel), combine(limit));

    const columns = R.compose(
      R.prepend(
        R.compose(
          R.prepend('x'),
          R.pluck(0)
        )(series[0])
      ),
      series => R.append(
        others(limit)(series),
        R.take(limit, series)
      ),
      R.sort((a, b) => R.sum(R.tail(b)) - R.sum(R.tail(a))),
      mapIndexed(
        (s, idx) => R.compose(
          R.prepend(accounts[idx]),
          R.map(R.when(R.equals(null), R.always(0))),
          R.pluck(1)
        )(s)
      )
    )(series);
    const types = R.compose(
      R.assoc(otherLabel, 'area'),
      R.reduce((acc, acct) => R.assoc(acct, 'area', acc), {})
    )(accounts);
    const groups = [R.append(otherLabel, accounts)];
    const data = { x: 'x', columns, types, groups };
    if (this.chart === null) {
      c3.generate({
        bindto: '#expensesChart',
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
      return <div id="expensesChart"></div>;
  }
}

export default Expenses;
