import React from 'react';
const c3 = require('c3');
const R = require('ramda');
import { balances } from '../lib/analyze';

class Explorer extends React.Component {
  constructor(props) {
    super(props);
    this.chart = null;
  }

  _renderChart(transactions) {
    if (!transactions || transactions.length === 0) return;

    const columns = R.compose(
      R.map(R.adjust(R.prop('$'), 1)),
      balances(2)(/^Expenses/)
    )(transactions);
    const data = {
      columns,
      type: 'pie'
    };
    if (this.chart === null) {
      this.chart = c3.generate({
          bindto: '#explorerPie',
          size: {
            height: 700
          },
          data
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
      return <div id="explorerPie"></div>;
  }
}

export default Explorer;
