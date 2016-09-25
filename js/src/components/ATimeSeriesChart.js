import React from 'react';
const d3 = require('d3');
const c3 = require('c3');

class ATimeSeriesChart extends React.Component {

  _renderChart(columns) {
    const timeSeriesChart = c3.generate({
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
    this._renderChart(this.props.data);
  }

  render() {
      return <div id="aTimeSeriesChart"></div>;
  }
}

export default ATimeSeriesChart;
