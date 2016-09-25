import React from 'react';
const d3 = require('d3');
const c3 = require('c3');

class APieChart extends React.Component {

  _renderChart(columns) {
    const pieChart = c3.generate({
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
    this._renderChart(this.props.data);
  }

  render() {
      return <div id="aPieChart"></div>;
  }
}

export default APieChart;
