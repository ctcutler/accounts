import React from 'react';
import AccountsOverTime from './AccountsOverTime';

class Expenses extends React.Component {
  render() {
    return (
      <AccountsOverTime
        transactions={this.props.transactions}
        chartId="expensesChart"
        accountRE={/^Expenses/}
        limit={10}
        invert={false}/>
    );
  }
}

export default Expenses;
