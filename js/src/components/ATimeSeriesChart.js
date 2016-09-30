import React from 'react';
const d3 = require('d3');
const c3 = require('c3');
const R = require('ramda');
import {overMonths, runningTotal} from '../analyze';

class ATimeSeriesChart extends React.Component {

  _renderChart(transactions) {
    const columns = R.compose(
      pairs => [R.pluck(0, pairs), R.pluck(1, pairs)],
      R.prepend(['x', 'data1']),
      runningTotal,
      overMonths(/^Assets/)
    )(transactions);
    c3.generate({
        bindto: '#aTimeSeriesChart',
        data: {
            x: 'x',
            columns
        },
        axis: {
            x: {
                type: 'timeseries',
            }
        }
    });
  }

  componentDidMount() {
    this._renderChart(this.props.transactions);
  }

  render() {
      return <div id="aTimeSeriesChart"></div>;
  }
}

export default ATimeSeriesChart;
