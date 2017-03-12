import React from 'react';
const c3 = require('c3');
const R = require('ramda');
import { normalizeMax, monthlyTimeSeriesByAccount,
  weeklyTimeSeriesByAccount, dailyTimeSeriesByAccount,
  quarterlyTimeSeriesByAccount, yearlyTimeSeriesByAccount,
  runningTotal } from '../lib/analyze';
import { invertDecimal } from '../lib/util';

class AccountsOverTime extends React.Component {
  constructor(props) {
    super(props);
    this.chart = null;
  }

  _renderChart(transactions) {
    if (!transactions || transactions.length === 0) return;

    const byAccountFunctions = {
      day: dailyTimeSeriesByAccount,
      week: weeklyTimeSeriesByAccount,
      month: monthlyTimeSeriesByAccount,
      quarter: quarterlyTimeSeriesByAccount,
      year: yearlyTimeSeriesByAccount,
    };
    const otherLabel = 'Others';
    const {
      accountRE, invert, chartId, limit, granularity, cumulative, stacked
    } = this.props;
    const [accounts, newSeries] = R.compose(
      R.transpose,
      R.toPairs,
      byAccountFunctions[granularity](accountRE)
    )(transactions);

    const series = R.compose(
      R.map(R.dropLast(1)),
      R.map(R.map(s => invert ? R.adjust(invertDecimal, 1, s) : s)),
      normalizeMax(granularity),
      R.when(R.always(cumulative), R.map(runningTotal)),
    )(newSeries);

    const mapIndexed = R.addIndex(R.map);
    const fold = f => l => R.reduce(f, R.head(l), R.tail(l));
    const others = limit => label => R.compose(
      R.prepend(label),
      fold(R.zipWith(R.add)),
      R.map(R.tail),
      R.drop(limit)
    );

    const columns = R.compose(
      R.prepend(
        R.compose(
          R.prepend('x'),
          R.pluck(0)
        )(series[0])
      ),
      series => R.append(
        others(limit)(otherLabel)(series),
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
    const data = { x: 'x', columns, types };
    if (stacked) {
      data['groups'] = groups;
    }
    if (this.chart === null) {
      c3.generate({
        bindto: '#'+chartId,
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
        grid: {
            y: {
                show: true
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
      return <div id={this.props.chartId}></div>;
  }
}

export default AccountsOverTime;
