import React from 'react';
import AccountsOverTime from './AccountsOverTime';
import './ByAccount.css';

const presets = {
  income: {
    regex: /^Income/,
    limit: 10,
    granularity: 'month',
    invert: true
  },
  expenses: {
    regex: /^Expenses/,
    limit: 10,
    granularity: 'month',
    invert: false
  }
};

class Income extends React.Component {
  constructor(props) {
    super(props);

    this.state = presets['income'];
    this.handleChange = this.handleChange.bind(this);
  }

  handleChange(event) {
    let val;
    if (event.target.id === 'limit') {
      val = parseInt(event.target.value, 10);
    } else if (event.target.id === 'invert') {
      val = event.target.checked;
    } else if (event.target.id === 'regex') {
      val = new RegExp(event.target.value);
    } else {
      val = event.target.value;
    }
    this.setState({[event.target.id]: val});
  }

  applyPreset(preset) {
    this.setState(presets[preset]);
  }

  render() {
    return (
      <div className="outer">
        <div className="filters">
          <span className="filter">
            Account Pattern: <input type="text"
                                    id="regex"
                                    value={this.state.regex.toString().slice(1, -1)}
                                    onChange={this.handleChange}/>
          </span>
          <span className="filter">
            Limit: <input type="text"
                          id="limit"
                          value={this.state.limit}
                          onChange={this.handleChange}/>
          </span>
          <span className="filter">
            Granularity: <select value={this.state.granularity}
                                 id="granularity"
                                 onChange={this.handleChange}>
                           <option value="day">Daily</option>
                           <option value="week">Weekly</option>
                           <option value="month">Monthly</option>
                           <option value="quarter">Quarterly</option>
                           <option value="year">Yearly</option>
                         </select>
          </span>
          <span className="filter">
            Invert: <input type="checkbox"
                           id="invert"
                           checked={this.state.invert}
                           onChange={this.handleChange}/>
          </span>
        </div>
        <div>
            Presets:
            <a className="filterPreset" onClick={evt => this.applyPreset('income')}>Income</a>
            <a className="filterPreset" onClick={evt => this.applyPreset('expenses')}>Expenses</a>
        </div>
        <AccountsOverTime
          transactions={this.props.transactions}
          chartId="accountsChart"
          accountRE={this.state.regex}
          limit={this.state.limit}
          granularity={this.state.granularity}
          invert={this.state.invert}/>
      </div>
    );
  }
}

export default Income;
