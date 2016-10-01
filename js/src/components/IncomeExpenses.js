import React from 'react';
const d3 = require('d3');
const c3 = require('c3');
const R = require('ramda');
import { overMonths, runningTotal, fillInMonths } from '../analyze';
import { addDecimal, parseDecimal, invertDecimal } from '../util';

class IncomeExpenses extends React.Component {

  _renderChart(transactions) {
    // FIXME: write function to normalize time ranges rather than hard coding
    // that R.drop(4). . . be sure to normalize *after* calculating running totals
    const incomeSeries = R.compose(
      R.drop(4),
      fillInMonths,
      R.map(R.adjust(invertDecimal, 1)),
      overMonths(/^Income/)
    )(transactions);
    const expensesSeries = R.compose(
      fillInMonths,
      R.map(R.adjust(invertDecimal, 1)),
      overMonths(/^Expenses/)
    )(transactions);

    const savingRateSeries = R.zipWith(
      (x, y) => R.when(v => v === undefined, v => null, addDecimal(x[1], y[1]))
    )(incomeSeries, expensesSeries);

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
    c3.generate({
      bindto: '#incomeExpensesChart',
      data: {
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
            id === 'savingRate'
              ? ((value / columns[1][index+1]) * 100).toFixed(2).toString() + '%'
              : value.toFixed(2).replace(/(\d)(?=(\d{3})+\.)/g, '$1,')
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
      return <div id="incomeExpensesChart"></div>;
  }
}

export default IncomeExpenses;
