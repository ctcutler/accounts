import React from 'react';
const c3 = require('c3');
const R = require('ramda');
import { overQuarters, fillInQuarters } from '../lib/analyze';
import { addDecimal, invertDecimal } from '../lib/util';

class SavingRate extends React.Component {
  constructor(props) {
    super(props);
    this.chart = null;
  }

  _renderChart(transactions) {
    if (!transactions || transactions.length === 0) return;

    const percentString = v => (v * 100).toFixed(2).toString() + '%';
    // from: http://stackoverflow.com/questions/149055/how-can-i-format-numbers-as-money-in-javascript
    const addCommas = v => v.toFixed(2).replace(/(\d)(?=(\d{3})+\.)/g, '$1,');
    // FIXME: write function to normalize time ranges rather than hard coding
    // that R.drop(4). . . be sure to normalize *after* calculating running totals
    const incomeSeries = R.compose(
      R.dropLast(1), // because last will be incomplete
      R.drop(1),
      fillInQuarters,
      R.map(R.adjust(invertDecimal, 1)),
      overQuarters(/^Income/)
    )(transactions);
    const expensesSeries = R.compose(
      R.dropLast(1), // because last will be incomplete
      fillInQuarters,
      R.map(R.adjust(invertDecimal, 1)),
      overQuarters(/^Expenses/)
    )(transactions);

    const savingRateSeries = R.zipWith(
      (x, y) => R.when(v => v === undefined, v => null, addDecimal(x[1], y[1]))
    )(incomeSeries, expensesSeries);

    // FIXME: abstract better and move to analyze.js
    // base on the formula found here: http://math.stackexchange.com/questions/204020/what-is-the-equation-used-to-calculate-a-linear-trendline/204021#204021
    const lrSlope = (xs, ys) =>
      (
        (xs.length * R.sum(R.zipWith(R.multiply, xs, ys)))
        -
        (R.sum(xs) * R.sum(ys))
      )
      /
      (
        (xs.length * R.sum(R.map(x => x * x, xs)))
        -
        (R.sum(xs) * R.sum(xs))
      );
    const lrOffset = (xs, ys, slope) =>
      (R.sum(ys) - (slope * R.sum(xs))) / xs.length;
    const rateIndexes = R.range(0, savingRateSeries.length);
    const m = lrSlope(rateIndexes, savingRateSeries);
    const b = lrOffset(rateIndexes, savingRateSeries, m);
    const trendSeries = R.map(R.compose(R.add(b), R.multiply(m)), rateIndexes);
    const columns = [
        R.prepend('x', R.pluck(0, incomeSeries)),
        R.prepend('Income', R.pluck(1, incomeSeries)),
        R.prepend('Expenses', R.pluck(1, expensesSeries)),
        R.prepend('savingRate', savingRateSeries),
        R.prepend('trend', trendSeries)
    ];
    const data = {
      x: 'x',
      columns,
      types: {
        Income: 'area',
        Expenses: 'area',
        savingRate: 'line',
        trend: 'line'
      },
      colors: {
        Income: '#079400',
        Expenses: '#DD0000',
        savingRate: '#000000',
        trend: '#0000FF',
      }
    };

    if (this.chart === null) {
      c3.generate({
        bindto: '#savingRateChart',
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
            value: (value, ratio, id, index) =>
              id === 'savingRate' || id === 'trend'
                ? addCommas(value) + ' (' + percentString(value / columns[1][index+1]) + ')'
                : addCommas(value)
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
      return <div id="savingRateChart"></div>;
  }
}

export default SavingRate;
