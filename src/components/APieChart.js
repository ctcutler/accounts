import React from 'react';
const c3 = require('c3');
const R = require('ramda');
import { balances } from '../lib/analyze';

class APieChart extends React.Component {

  _renderChart(transactions) {
    const columns = R.compose(
      R.map(R.adjust(R.prop('$'), 1)),
      balances(/^Assets/)
    )(transactions);
    c3.generate({
        bindto: '#aPieChart',
        size: {
          height: 700
        },
        data: {
          type: 'pie',
          columns
        }
    });
  }

  componentDidMount() {
    this._renderChart(this.props.transactions);
  }

  render() {
      return <div id="aPieChart"></div>;
  }
}

export default APieChart;
