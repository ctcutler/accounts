import React from 'react';
const d3 = require('d3');
const c3 = require('c3');
const R = require('ramda');
import { overMonths, runningTotal, fillInMonths } from '../analyze';
import { addDecimal, parseDecimal } from '../util';

class NetWorth extends React.Component {

  _renderChart(transactions) {
    // FIXME: write function to normalize time ranges rather than hard coding
    // that R.drop(6). . . be sure to normalize *after* calculating running totals
    const assetSeries = R.compose(
      R.drop(5),
      fillInMonths,
      runningTotal,
      overMonths(/^Assets/)
    )(transactions);
    const liabilitySeries = R.compose(
      fillInMonths,
      runningTotal,
      overMonths(/^Liabilities/)
    )(transactions);

    const calcDelta = R.zipWith(
      (x, y) => R.when(v => v === undefined, v => null, addDecimal(x[1], y[1]))
    );
    const columns = [
        R.prepend('x', R.pluck(0, assetSeries)),
        R.prepend('Assets', R.pluck(1, assetSeries)),
        R.prepend('Liabilities', R.pluck(1, liabilitySeries)),
        R.prepend('netWorth', calcDelta(assetSeries, liabilitySeries))
    ];
    c3.generate({
      bindto: '#netWorthChart',
      data: {
        x: 'x',
        columns,
        types: {
          Assets: 'area',
          Liabilities: 'area',
          netWorth: 'line'
        },
        colors: {
          Assets: '#079400',
          Liabilities: '#DD0000',
          netWorth: '#000000',
        }
      },
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
            value.toFixed(2).replace(/(\d)(?=(\d{3})+\.)/g, '$1,')
        }
      },
      point: {
        show: false
      }
    });
  }

  componentDidMount() {
    this._renderChart(this.props.transactions);
  }

  render() {
      return <div id="netWorthChart"></div>;
  }
}

export default NetWorth;
