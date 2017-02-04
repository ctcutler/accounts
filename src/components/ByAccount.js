import React from 'react';
import AccountsOverTime from './AccountsOverTime';

const presets = {
  income: {
    regex: /^Income/,
    limit: 10,
    invert: true
  },
  expenses: {
    regex: /^Expenses/,
    limit: 10,
    invert: false
  }
};

class Income extends React.Component {
  constructor(props) {
    super(props);

    this.state = presets['income'];
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

  // FIXME: get some styling in here and get rid of the nonbreaking spaces
  // and make the links look like links!

  render() {
    return (
      <div>
        <form>
          Account Pattern: <input type="text"
                                  id="regex"
                                  value={this.state.regex.toString().slice(1, -1)}
                                  onChange={this.handleChange}/> &nbsp;&nbsp;
          Limit: <input type="text"
                        id="limit"
                        value={this.state.limit}
                        onChange={this.handleChange}/> &nbsp;&nbsp;
          Invert: <input type="checkbox"
                         id="invert"
                         checked={this.state.invert}
                         onChange={this.handleChange}/> &nbsp;&nbsp;
        </form>
        <div>
            <a onClick={evt => this.applyPreset('income')}>Income</a> &nbsp;&nbsp; <a onClick={evt => this.applyPreset('expenses')}>Expenses</a>
        </div>
        <AccountsOverTime
          transactions={this.props.transactions}
          chartId="accountsChart"
          accountRE={this.state.regex}
          limit={this.state.limit}
          invert={this.state.invert}/>
      </div>
    );
  }
}

export default Income;
